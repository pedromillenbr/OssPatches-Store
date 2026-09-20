import type { NextApiRequest, NextApiResponse } from 'next';
import { appendOrderToSheet } from '@/services/googleSheets';
import { sendOrderConfirmationEmail } from '@/services/email';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge, sanitizeForSheets } from '@/lib/sanitize';
import { verifyAndCalculateSubtotal } from '@/lib/priceVerifier';
import { handleCors } from '@/lib/cors';
import { generateOrderId } from '@/lib/orderId';
import { cleanAddress, cleanCustomer, cleanShippingLabel } from '@/lib/checkoutGuards';
import { checkCoupon, holdPixUse, registerUse } from '@/lib/couponUsage';
import { validateShippingCost } from '@/lib/shipping';
import type { Order } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (await rejectIfRateLimited('orders', req, res)) return;
  if (isBodyTooLarge(req, 50 * 1024)) return res.status(413).json({ error: 'Requisição muito grande' });

  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: 'Gateway de pagamento não configurado' });

  const raw = req.body ?? {};
  const { items, customer: rawCustomer, address: rawAddress, shipping, shippingCost, couponCode, cardToken, paymentMethodId, installments, issuerId } =
    sanitizeForSheets(raw);

  if (!items?.length || typeof cardToken !== 'string' || !cardToken || typeof paymentMethodId !== 'string' || !/^[a-z_]{2,30}$/.test(paymentMethodId)) {
    return res.status(400).json({ error: 'Dados de pagamento incompletos' });
  }

  const customerCheck = cleanCustomer(rawCustomer);
  if (!customerCheck.ok) return res.status(400).json({ error: customerCheck.error });
  const customer = customerCheck.value;

  // Cartão via Mercado Pago é exclusivo do Brasil.
  if (customer.countryCode !== 'BR') {
    return res.status(400).json({ error: 'Cartão disponível apenas para pedidos no Brasil.' });
  }

  // CEP válido é obrigatório — sem ele o frete não era revalidado e o valor
  // do cliente (até negativo) era aceito.
  const addressCheck = cleanAddress(rawAddress, 'BR');
  if (!addressCheck.ok) return res.status(400).json({ error: addressCheck.error });
  const address = addressCheck.value;

  const priceResult = verifyAndCalculateSubtotal(items);
  if (!priceResult.ok) {
    return res.status(400).json({ error: priceResult.error || 'Carrinho inválido' });
  }

  const serverSubtotal = priceResult.serverSubtotal;

  // Validar o frete no servidor — nunca confiar no valor enviado pelo cliente.
  const shippingCheck = await validateShippingCost(address.zipCode, priceResult.items, shippingCost);
  const serverShipping = shippingCheck.shippingCost;

  // Cupom revalidado no servidor (existe, ligado, cliente com saldo).
  const coupon = await checkCoupon(couponCode, customer.email);
  if (couponCode && coupon.error) {
    return res.status(400).json({ error: coupon.error });
  }
  const discountPercent = coupon.percent;
  const appliedCoupon = coupon.code;

  const discountAmount = Math.round(serverSubtotal * discountPercent) / 100;
  const serverTotal = Math.round((serverSubtotal - discountAmount + serverShipping) * 100) / 100;

  const orderId = generateOrderId();
  // Clamp installments to the allowed 1–12 range — never trust the client value.
  // transaction_amount stays the base total; Mercado Pago adds card interest on
  // top and charges it to the buyer (juros por conta do comprador).
  const installmentCount = Math.min(12, Math.max(1, Number(installments) || 1));

  const nameParts = (customer.name || 'Cliente').trim().split(' ');
  const email = (customer.email || '').trim().toLowerCase();

  // Mercado Pago Transparent Checkout — card payment
  const mpBody: Record<string, unknown> = {
    transaction_amount: serverTotal,
    token: cardToken,
    description: `OssPatches ${orderId}`,
    installments: installmentCount,
    payment_method_id: paymentMethodId,
    ...(issuerId && /^\d{1,10}$/.test(String(issuerId)) ? { issuer_id: String(issuerId) } : {}),
    payer: {
      email,
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(' ') || nameParts[0],
      ...(customer.cpf
        ? { identification: { type: 'CPF', number: customer.cpf.replace(/\D/g, '') } }
        : {}),
    },
    external_reference: orderId,
    statement_descriptor: 'OSSPATCHES',
  };

  let mpResponse: Record<string, unknown>;
  try {
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify(mpBody),
    });

    mpResponse = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP card error:', mpRes.status, mpResponse);
      const userMsg = mpResponse?.message || 'Falha ao processar cartão';
      return res.status(402).json({ error: String(userMsg) });
    }
  } catch (err) {
    console.error('MP network error:', err);
    return res.status(502).json({ error: 'Erro de comunicação com o gateway. Tente novamente.' });
  }

  const mpStatus = String(mpResponse.status);

  // rejected — inform user with MP's reason
  if (mpStatus === 'rejected') {
    const detail = String(mpResponse.status_detail || '');
    const friendlyMessages: Record<string, string> = {
      cc_rejected_insufficient_amount: 'Saldo insuficiente no cartão.',
      cc_rejected_bad_filled_card_number: 'Número de cartão inválido.',
      cc_rejected_bad_filled_date: 'Data de validade inválida.',
      cc_rejected_bad_filled_security_code: 'CVV inválido.',
      cc_rejected_call_for_authorize: 'Cartão requer autorização. Ligue para seu banco.',
      cc_rejected_card_disabled: 'Cartão desabilitado. Entre em contato com seu banco.',
      cc_rejected_duplicated_payment: 'Pagamento duplicado detectado.',
    };
    const msg = friendlyMessages[detail] || 'Pagamento recusado pelo banco. Verifique os dados ou tente outro cartão.';
    return res.status(402).json({ error: msg, detail });
  }

  const now = new Date().toISOString();
  const order: Order = {
    id: orderId,
    items: priceResult.items,
    customer,
    address,
    shipping: cleanShippingLabel(shipping, serverShipping),
    payment: {
      method: paymentMethodId.startsWith('debit') ? 'debit_card' : 'credit_card',
      installments: installmentCount,
    },
    subtotal: serverSubtotal,
    shippingCost: serverShipping,
    total: serverTotal,
    currency: 'BRL',
    status: mpStatus === 'approved' ? 'confirmed' : 'pending',
    createdAt: now,
    ...(appliedCoupon ? { couponCode: appliedCoupon, discountPercent, discountAmount } : {}),
  };

  // Cartão aprovado na hora já conta como uma das compras do cliente. Se o
  // Mercado Pago deixou em análise, a contagem fica reservada e só é
  // confirmada pelo webhook quando o pagamento for aprovado.
  if (appliedCoupon) {
    if (mpStatus === 'approved') {
      await registerUse(appliedCoupon, customer.email);
    } else {
      await holdPixUse(orderId, appliedCoupon, customer.email);
    }
  }

  try { await appendOrderToSheet(order); } catch (err) { console.error('Sheets error:', err); }
  sendOrderConfirmationEmail(order).catch((err) => console.error('Email error:', err));

  return res.status(201).json({
    orderId,
    status: order.status,
    mpStatus,
    message: mpStatus === 'approved' ? 'Pagamento aprovado!' : 'Pagamento em análise.',
  });
}
