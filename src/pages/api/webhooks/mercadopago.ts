import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { updateOrderStatusInSheet, getOrderFromSheet } from '@/services/googleSheets';
import { sendPaymentConfirmedEmail } from '@/services/email';
import { Order } from '@/types';

function validateSignature(req: NextApiRequest, secret: string): boolean {
  const xSignature = req.headers['x-signature'] as string;
  const xRequestId = req.headers['x-request-id'] as string;
  const { 'data.id': dataId } = req.query;

  if (!xSignature || !xRequestId) return false;

  // Parse ts and v1 from x-signature header
  const parts = xSignature.split(',');
  let ts = '';
  let v1 = '';
  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') v1 = value;
  }

  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  // timingSafeEqual throws when buffers differ in length — guard against it so
  // a malformed signature returns false (401) instead of crashing with a 500.
  const v1Buf = Buffer.from(v1, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (v1Buf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(v1Buf, expectedBuf);
}

async function fetchPaymentFromMP(paymentId: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`MP returned ${res.status}`);
  return res.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  // Validate signature if secret is configured
  if (secret) {
    const valid = validateSignature(req, secret);
    if (!valid) {
      console.warn('[webhook] Invalid signature — request rejected');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { type, action, data } = req.body as {
    type: string;
    action: string;
    data: { id: string };
  };

  // Only handle payment events
  if (type !== 'payment') {
    return res.status(200).json({ received: true });
  }

  console.log(`[webhook] Payment event: action=${action} id=${data?.id}`);

  try {
    const payment = await fetchPaymentFromMP(data.id);
    const { status, external_reference: orderId } = payment;

    console.log(`[webhook] Payment ${data.id} → status=${status} orderId=${orderId}`);

    if (orderId) {
      await updateOrderStatusInSheet(orderId, status, data.id);

      if (status === 'approved') {
        const order = await getOrderFromSheet(orderId);
        if (order?.customer?.email) {
          sendPaymentConfirmedEmail(order as Order).catch((err) =>
            console.error('[webhook] Email error:', err)
          );
        }
      }
    }

    return res.status(200).json({ received: true, status });
  } catch (err) {
    console.error('[webhook] Error processing payment:', err);
    // Always return 200 to MP so it stops retrying on our processing errors
    return res.status(200).json({ received: true, error: 'Processing error logged' });
  }
}
