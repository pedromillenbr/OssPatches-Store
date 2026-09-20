import type { NextApiRequest, NextApiResponse } from 'next';
import { Order } from '@/types';
import { appendOrderToSheet } from '@/services/googleSheets';
import { sendOrderConfirmationEmail } from '@/services/email';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge, sanitizeForSheets } from '@/lib/sanitize';
import { verifyAndCalculateSubtotal } from '@/lib/priceVerifier';
import { handleCors } from '@/lib/cors';
import { generateOrderId } from '@/lib/orderId';
import { validateShippingCost } from '@/lib/shipping';
import { cleanAddress, cleanCustomer, cleanShippingLabel } from '@/lib/checkoutGuards';
import { checkCoupon, holdPixUse } from '@/lib/couponUsage';

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

  const { items, customer: rawCustomer, address: rawAddress, shipping, payment, shippingCost, couponCode } =
    sanitizeForSheets(req.body ?? {});

  // Esta rota só gera Pix (cartão usa /api/mp/card-payment e PayPal tem rota
  // própria). Recusar outros métodos evita "pedidos" sem pagamento algum.
  if (payment?.method !== 'pix') {
    return res.status(400).json({ error: 'Forma de pagamento inválida' });
  }

  // Valida e reconstrói cliente/endereço só com campos conhecidos.
  const customerCheck = cleanCustomer(rawCustomer);
  if (!customerCheck.ok) return res.status(400).json({ error: customerCheck.error });
  const customer = customerCheck.value;

  // Pix é exclusivo do Brasil — sem isso, mandar país "US" pulava a
  // revalidação do frete no servidor.
  if (customer.countryCode !== 'BR') {
    return res.status(400).json({ error: 'Pix disponível apenas para pedidos no Brasil.' });
  }

  const addressCheck = cleanAddress(rawAddress, 'BR');
  if (!addressCheck.ok) return res.status(400).json({ error: addressCheck.error });
  const address = addressCheck.value;

  // Re-derive subtotal entirely from server-side product catalog — never trust client prices
  const priceResult = verifyAndCalculateSubtotal(items);
  if (!priceResult.ok) {
    return res.status(400).json({ error: priceResult.error || 'Carrinho inválido' });
  }
  const serverSubtotal = priceResult.serverSubtotal;

  // Frete sempre revalidado no servidor pelo CEP (nunca negativo, nunca abaixo
  // da opção real mais barata).
  const shippingCheck = await validateShippingCost(address.zipCode, priceResult.items, shippingCost);
  const serverShipping = shippingCheck.shippingCost;

  // Cupom revalidado no servidor: existe, está ligado e o cliente ainda tem
  // compras disponíveis. Se foi recusado, paramos aqui — cobrar sem o
  // desconto que a tela prometeu seria cobrar a mais sem o cliente saber.
  const coupon = await checkCoupon(couponCode, customer.email);
  if (couponCode && coupon.error) {
    return res.status(400).json({ error: coupon.error });
  }
  const discountPercent = coupon.percent;
  const appliedCoupon = coupon.code;

  const discountAmount = Math.round(serverSubtotal * discountPercent) / 100;
  const serverTotal = Math.round((serverSubtotal - discountAmount + serverShipping) * 100) / 100;

  const orderId = generateOrderId();
  const now = new Date().toISOString();

  const order: Order = {
    id: orderId,
    items: priceResult.items,
    customer,
    address,
    shipping: cleanShippingLabel(shipping, serverShipping),
    payment: { method: 'pix' },
    subtotal: serverSubtotal,
    shippingCost: serverShipping,
    total: serverTotal,
    currency: 'BRL',
    status: 'pending',
    createdAt: now,
    ...(appliedCoupon ? { couponCode: appliedCoupon, discountPercent, discountAmount } : {}),
  };

  // O uso do cupom fica "reservado" e só vira uso de verdade quando o
  // Mercado Pago confirmar o pagamento (ver webhook). Pix gerado e não pago
  // não queima uma das compras do cliente.
  if (appliedCoupon) {
    await holdPixUse(orderId, appliedCoupon, customer.email);
  }

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
