import type { NextApiRequest, NextApiResponse } from 'next';
import { capturePayPalOrder } from '@/services/paypal';
import { appendOrderToSheet } from '@/services/googleSheets';
import { sendOrderConfirmationEmail } from '@/services/email';
import { isBodyTooLarge, sanitizeForSheets } from '@/lib/sanitize';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { handleCors } from '@/lib/cors';
import { cleanAddress, cleanCustomer, cleanShippingLabel, ORDER_ID_REGEX } from '@/lib/checkoutGuards';
import { checkCoupon, registerUse } from '@/lib/couponUsage';
import { computePayPalTotals } from '@/lib/paypalTotals';
import type { Order } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (await rejectIfRateLimited('paypal', req, res)) return;
  if (isBodyTooLarge(req, 50 * 1024)) return res.status(413).json({ error: 'Requisição muito grande' });

  const { paypalOrderId, ossOrderId, items, customer: rawCustomer, address: rawAddress, shipping, couponCode } =
    sanitizeForSheets(req.body ?? {});

  if (
    typeof paypalOrderId !== 'string' || !/^[A-Z0-9]{10,30}$/.test(paypalOrderId) ||
    typeof ossOrderId !== 'string' || !ORDER_ID_REGEX.test(ossOrderId)
  ) {
    return res.status(400).json({ error: 'IDs de pedido ausentes ou inválidos' });
  }

  const customerCheck = cleanCustomer(rawCustomer);
  if (!customerCheck.ok) return res.status(400).json({ error: customerCheck.error });
  const customer = customerCheck.value;
  if (customer.countryCode === 'BR') {
    return res.status(400).json({ error: 'PayPal disponível apenas para clientes internacionais.' });
  }

  const addressCheck = cleanAddress(rawAddress, customer.countryCode);
  if (!addressCheck.ok) return res.status(400).json({ error: addressCheck.error });

  // Recalcula no servidor o que ESTES itens custam. Validamos ANTES de capturar
  // para não cobrar um carrinho inválido.
  // Aqui o dinheiro JÁ foi capturado no PayPal — nunca recusamos o pedido por
  // causa do cupom neste ponto. Se o saldo acabou entre o create e o capture,
  // `checkCoupon` devolve percent 0 e o pedido segue sem desconto.
  const coupon = await checkCoupon(couponCode, customer.email);
  const totals = computePayPalTotals(items, coupon.percent);
  if (!totals.ok) return res.status(totals.status).json({ error: totals.error });

  try {
    const capture = await capturePayPalOrder(paypalOrderId);

    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: `Pagamento não aprovado: ${capture.status}` });
    }

    // Nunca confiar no `total` que o cliente mandou no corpo — usar SOMENTE o valor
    // que o PayPal confirma ter capturado.
    const unit = capture.purchase_units?.[0];
    const capturedAmount = unit?.payments?.captures?.[0]?.amount;
    const paidTotal = Number(capturedAmount?.value);
    const paidCurrency = capturedAmount?.currency_code || 'USD';

    if (!Number.isFinite(paidTotal) || paidTotal <= 0) {
      console.error('PayPal capture sem valor confirmado:', capture.id);
      return res.status(502).json({ error: 'Não foi possível confirmar o valor pago. Contate o suporte.' });
    }

    // Amarra o pagamento ao pedido: o PayPal order precisa ter sido criado para
    // ESTE ossOrderId, e o valor pago precisa cobrir os itens enviados. Sem isso,
    // alguém pagava um patch barato e registrava faixas caras como "confirmed".
    const referenceMismatch = !!unit?.reference_id && unit.reference_id !== ossOrderId;
    const amountShort = paidCurrency !== 'USD' || paidTotal + 0.01 < totals.totalUSD;
    const suspicious = referenceMismatch || amountShort;

    const now = new Date().toISOString();
    const order: Order = {
      id: ossOrderId,
      items: totals.items,
      customer,
      address: addressCheck.value,
      shipping: cleanShippingLabel(shipping, 0),
      payment: { method: 'paypal' },
      subtotal: totals.subtotalBRL,
      shippingCost: 0,
      total: paidTotal,
      currency: paidCurrency,
      status: suspicious ? 'pending' : 'confirmed',
      createdAt: now,
      ...(coupon.code
        ? { couponCode: coupon.code, discountPercent: coupon.percent, discountAmount: totals.discountAmountBRL }
        : {}),
      ...(suspicious
        ? {
            notes: `REVISAR ANTES DE ENVIAR: pago ${paidCurrency} ${paidTotal.toFixed(2)}, esperado USD ${totals.totalUSD.toFixed(2)}` +
              (referenceMismatch ? ` | referência PayPal ${unit?.reference_id} ≠ ${ossOrderId}` : ''),
          }
        : {}),
    };

    // PayPal capturado = compra paga: conta uma das compras do cliente.
    if (coupon.code && !suspicious) {
      await registerUse(coupon.code, customer.email);
    }

    try {
      await appendOrderToSheet(order);
    } catch (err) {
      console.error('Google Sheets error:', err);
    }

    if (suspicious) {
      console.error(`[paypal] Pagamento divergente no pedido ${ossOrderId}: ${order.notes}`);
      return res.status(409).json({
        error: 'Recebemos seu pagamento, mas os dados do pedido não conferem. Nossa equipe vai entrar em contato.',
        orderId: ossOrderId,
      });
    }

    sendOrderConfirmationEmail(order).catch((err) =>
      console.error('Email confirmation error:', err)
    );

    return res.status(200).json({ orderId: ossOrderId, status: 'confirmed' });
  } catch (err) {
    console.error('PayPal capture-order:', err);
    return res.status(502).json({ error: 'Falha ao capturar pagamento PayPal. Contate o suporte.' });
  }
}
