import type { NextApiRequest, NextApiResponse } from 'next';
import { createPayPalOrder } from '@/services/paypal';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { handleCors } from '@/lib/cors';
import { verifyAndCalculateSubtotal } from '@/lib/priceVerifier';
import { VALID_COUPONS } from '@/config/coupons';
import { CONFIG } from '@/config';

function generateOrderId(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `OSS-${yy}${mm}${dd}-${rand}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (await rejectIfRateLimited('paypal', req, res)) return;

  const { items, shippingCost, couponCode, countryCode } = req.body;

  // PayPal is only for international customers — block BR server-side
  if (!countryCode || countryCode === 'BR') {
    return res.status(400).json({ error: 'PayPal disponível apenas para clientes internacionais.' });
  }

  if (!items?.length) return res.status(400).json({ error: 'Carrinho vazio' });

  const priceResult = verifyAndCalculateSubtotal(items);
  if (!priceResult.ok) {
    return res.status(400).json({ error: priceResult.error || 'Carrinho inválido' });
  }

  const serverSubtotalBRL = priceResult.serverSubtotal;
  const serverShippingBRL = Number(shippingCost) || 0;

  let discountAmount = 0;
  if (couponCode && typeof couponCode === 'string') {
    const pct = VALID_COUPONS[couponCode.trim().toUpperCase()];
    if (pct) discountAmount = Math.round(serverSubtotalBRL * pct) / 100;
  }

  const totalBRL = Math.round((serverSubtotalBRL - discountAmount + serverShippingBRL) * 100) / 100;

  // Convert BRL → USD using the configured rate
  const rate = CONFIG.brlToUsd;
  const totalUSD = Math.round(totalBRL * rate * 100) / 100;

  const orderId = generateOrderId();

  try {
    const paypalOrder = await createPayPalOrder({
      orderId,
      total: totalUSD,
      currency: 'USD',
      description: `OssPatches Order ${orderId}`,
    });

    return res.status(200).json({
      paypalOrderId: paypalOrder.id,
      ossOrderId: orderId,
      totalBRL,
      totalUSD,
      currency: 'USD',
    });
  } catch (err) {
    console.error('PayPal create-order:', err);
    return res.status(502).json({ error: 'Não foi possível iniciar pagamento PayPal. Tente novamente.' });
  }
}
