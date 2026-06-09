import type { NextApiRequest, NextApiResponse } from 'next';
import { Order } from '@/types';
import { appendOrderToSheet } from '@/services/googleSheets';
import { VALID_COUPONS } from '@/config/coupons';
import { sendOrderConfirmationEmail } from '@/services/email';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge, sanitizeForSheets } from '@/lib/sanitize';
import { verifyAndCalculateSubtotal } from '@/lib/priceVerifier';
import { handleCors } from '@/lib/cors';
import { isValidCPF } from '@/lib/cpf';
import { isValidEmail } from '@/lib/email';

function generateOrderId(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `OSS-${yy}${mm}${dd}-${rand}`;
}

async function createPixPayment(order: Order, total: number): Promise<{
  mpPaymentId: string;
  pixQrCode: string;
  pixCode: string;
}> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error('Mercado Pago not configured');

  const email = (order.customer.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('E-mail do cliente inválido');
  }

  const nameParts = (order.customer.name || 'Cliente').trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const body: Record<string, unknown> = {
    transaction_amount: Math.round(total * 100) / 100,
    description: `Pedido OssPatches ${order.id}`,
    payment_method_id: 'pix',
    payer: {
      email,
      first_name: firstName,
      last_name: lastName,
      ...(order.customer.cpf
        ? { identification: { type: 'CPF', number: order.customer.cpf.replace(/\D/g, '') } }
        : {}),
    },
    external_reference: order.id,
  };

  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': order.id,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Mercado Pago error:', res.status, err);
    throw new Error('Falha ao gerar pagamento Pix');
  }

  const data = await res.json();
  const txInfo = data.point_of_interaction?.transaction_data;

  if (!txInfo?.qr_code_base64 || !txInfo?.qr_code) {
    throw new Error('QR Code não retornado pelo Mercado Pago');
  }

  return {
    mpPaymentId: String(data.id),
    pixQrCode: txInfo.qr_code_base64,
    pixCode: txInfo.qr_code,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('orders', req, res)) return;

  // Reject bodies larger than 50 KB — prevents memory exhaustion attacks
  if (isBodyTooLarge(req, 50 * 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const rawBody = req.body;
  // Sanitize all string fields before they touch Google Sheets
  const {
    items,
    customer,
    address,
    shipping,
    payment,
    subtotal,
    shippingCost,
    couponCode,
    currency,
  } = sanitizeForSheets(rawBody);

  if (!items?.length || !customer || !address || !payment) {
    return res.status(400).json({ error: 'Missing required order fields' });
  }

  // Validate email server-side — required by the payment gateway and for the
  // confirmation receipt. Never trust the client's own validation.
  if (!isValidEmail(customer?.email || '')) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  // Validate CPF for Brazilian customers
  const isBrazilian = customer?.countryCode === 'BR';
  if (isBrazilian && customer?.cpf && !isValidCPF(customer.cpf)) {
    return res.status(400).json({ error: 'CPF inválido' });
  }

  // Re-derive subtotal entirely from server-side product catalog — never trust client prices
  const priceResult = verifyAndCalculateSubtotal(items);
  if (!priceResult.ok) {
    return res.status(400).json({ error: priceResult.error || 'Carrinho inválido' });
  }
  const serverSubtotal = priceResult.serverSubtotal;
  const serverShipping = Number(shippingCost) || 0;

  let discountPercent = 0;
  let appliedCoupon: string | null = null;

  if (couponCode && typeof couponCode === 'string') {
    const upperCode = couponCode.trim().toUpperCase();
    const discount = VALID_COUPONS[upperCode];
    if (discount) {
      discountPercent = discount;
      appliedCoupon = upperCode;
    }
  }

  const discountAmount = Math.round(serverSubtotal * discountPercent) / 100;
  const serverTotal = Math.round((serverSubtotal - discountAmount + serverShipping) * 100) / 100;

  const orderId = generateOrderId();
  const now = new Date().toISOString();

  const order: Order = {
    id: orderId,
    items,
    customer,
    address,
    shipping: shipping || null,
    payment,
    subtotal: serverSubtotal,
    shippingCost: serverShipping,
    total: serverTotal,
    currency: currency || 'BRL',
    status: 'pending',
    createdAt: now,
    ...(appliedCoupon ? { couponCode: appliedCoupon, discountPercent, discountAmount } : {}),
  };

  try {
    await appendOrderToSheet(order);
  } catch (err) {
    console.error('Google Sheets error:', err);
  }

  // Send confirmation email (non-fatal)
  sendOrderConfirmationEmail(order).catch((err) =>
    console.error('Email confirmation error:', err)
  );

  if (payment.method === 'pix') {
    try {
      const pixData = await createPixPayment(order, serverTotal);
      return res.status(201).json({
        orderId,
        status: 'pending',
        pix: pixData,
      });
    } catch (err) {
      console.error('Pix error:', err);
      return res.status(502).json({ error: 'Não foi possível gerar o QR Code Pix. Tente outro método de pagamento.' });
    }
  }

  return res.status(201).json({
    orderId,
    status: 'pending',
    message: 'Pedido criado com sucesso',
  });
}
