import type { NextApiRequest, NextApiResponse } from 'next';
import { createPayPalOrder } from '@/services/paypal';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';
import { resolveCoupon } from '@/lib/checkoutGuards';
import { computePayPalTotals } from '@/lib/paypalTotals';
import { generateOrderId } from '@/lib/orderId';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (await rejectIfRateLimited('paypal', req, res)) return;
  if (isBodyTooLarge(req, 50 * 1024)) return res.status(413).json({ error: 'Requisição muito grande' });

  const { items, couponCode, countryCode } = req.body ?? {};

  // PayPal is only for international customers — block BR server-side
  if (typeof countryCode !== 'string' || !/^[A-Z]{2,3}$/.test(countryCode) || countryCode === 'BR') {
    return res.status(400).json({ error: 'PayPal disponível apenas para clientes internacionais.' });
  }

  // O frete internacional é cobrado à parte, depois da compra (ver ShippingStep).
  // Por isso o valor de frete enviado pelo cliente é IGNORADO — antes ele era
  // somado ao total e um valor negativo baixava o preço cobrado.
  const totals = computePayPalTotals(items, resolveCoupon(couponCode).percent);
  if (!totals.ok) return res.status(totals.status).json({ error: totals.error });

  const orderId = generateOrderId();

  try {
    const paypalOrder = await createPayPalOrder({
      orderId,
      total: totals.totalUSD,
      currency: 'USD',
      description: `OssPatches Order ${orderId}`,
    });

    return res.status(200).json({
      paypalOrderId: paypalOrder.id,
      ossOrderId: orderId,
      totalBRL: totals.totalBRL,
      totalUSD: totals.totalUSD,
      currency: 'USD',
    });
  } catch (err) {
    console.error('PayPal create-order:', err);
    return res.status(502).json({ error: 'Não foi possível iniciar pagamento PayPal. Tente novamente.' });
  }
}
