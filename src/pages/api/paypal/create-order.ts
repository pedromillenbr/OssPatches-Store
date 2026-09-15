import type { NextApiRequest, NextApiResponse } from 'next';
import { createPayPalOrder } from '@/services/paypal';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';
import { verifyAndCalculateSubtotal } from '@/lib/priceVerifier';
import { VALID_COUPONS } from '@/config/coupons';
import { generateOrderId } from '@/lib/orderId';
import { CONFIG } from '@/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (await rejectIfRateLimited('paypal', req, res)) return;
  if (isBodyTooLarge(req, 50 * 1024)) return res.status(413).json({ error: 'Requisição muito grande' });

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
  const serverSubtotalUSD = priceResult.serverSubtotalUSD;
  const serverShippingBRL = Number(shippingCost) || 0;

  // O preço internacional vem de valores fixos em USD no catálogo (não de câmbio).
  // Se algum produto não tiver preço USD, o subtotal fica 0 — recusamos a venda
  // em vez de cobrar US$0.
  if (!serverSubtotalUSD || serverSubtotalUSD <= 0) {
    return res.status(422).json({ error: 'Produto sem preço internacional disponível.' });
  }

  let discountAmount = 0;      // em BRL (para registro do pedido)
  let discountAmountUSD = 0;   // em USD (para cobrança real)
  if (couponCode && typeof couponCode === 'string') {
    const pct = VALID_COUPONS[couponCode.trim().toUpperCase()];
    if (pct) {
      discountAmount = Math.round(serverSubtotalBRL * pct) / 100;
      discountAmountUSD = Math.round(serverSubtotalUSD * pct) / 100;
    }
  }

  const totalBRL = Math.round((serverSubtotalBRL - discountAmount + serverShippingBRL) * 100) / 100;

  // Frete internacional: ainda convertido por câmbio (valor pequeno; sem preço
  // USD fixo definido). O grosso do total agora é preço fixo em dólar.
  const shippingUSD = Math.round(serverShippingBRL * CONFIG.brlToUsd * 100) / 100;
  const totalUSD = Math.round((serverSubtotalUSD - discountAmountUSD + shippingUSD) * 100) / 100;

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
