import type { NextApiRequest, NextApiResponse } from 'next';
import { capturePayPalOrder } from '@/services/paypal';
import { appendOrderToSheet } from '@/services/googleSheets';
import { sendOrderConfirmationEmail } from '@/services/email';
import { sanitizeForSheets } from '@/lib/sanitize';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { handleCors } from '@/lib/cors';
import type { Order } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (await rejectIfRateLimited('paypal', req, res)) return;

  const raw = req.body;
  const { paypalOrderId, ossOrderId, items, customer, address, shipping, total, shippingCost, currency, couponCode, discountPercent, discountAmount } =
    sanitizeForSheets(raw);

  if (!paypalOrderId || !ossOrderId) {
    return res.status(400).json({ error: 'IDs de pedido ausentes' });
  }

  try {
    const capture = await capturePayPalOrder(paypalOrderId);

    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: `Pagamento não aprovado: ${capture.status}` });
    }

    const now = new Date().toISOString();
    const order: Order = {
      id: ossOrderId,
      items,
      customer,
      address,
      shipping: shipping || null,
      payment: { method: 'paypal' },
      subtotal: Number(total) - Number(shippingCost || 0) + Number(discountAmount || 0),
      shippingCost: Number(shippingCost) || 0,
      total: Number(total),
      currency: currency || 'USD',
      status: 'confirmed',
      createdAt: now,
      ...(couponCode ? { couponCode, discountPercent: Number(discountPercent), discountAmount: Number(discountAmount) } : {}),
    };

    try {
      await appendOrderToSheet(order);
    } catch (err) {
      console.error('Google Sheets error:', err);
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
