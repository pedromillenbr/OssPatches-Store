import type { NextApiRequest, NextApiResponse } from 'next';
import { Order } from '@/types';
import { appendOrderToSheet } from '@/services/googleSheets';

function generateOrderId(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `OSS-${yy}${mm}${dd}-${rand}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    items,
    customer,
    address,
    shipping,
    payment,
    subtotal,
    shippingCost,
    total,
    currency,
  } = req.body;

  // Basic validation
  if (!items?.length || !customer || !address || !payment) {
    return res.status(400).json({ error: 'Missing required order fields' });
  }

  const orderId = generateOrderId();
  const now = new Date().toISOString();

  const order: Order = {
    id: orderId,
    items,
    customer,
    address,
    shipping: shipping || null,
    payment,
    subtotal,
    shippingCost: shippingCost || 0,
    total,
    currency: currency || 'BRL',
    status: 'pending',
    createdAt: now,
  };

  // Save to Google Sheets (non-blocking)
  try {
    await appendOrderToSheet(order);
  } catch (err) {
    // Log but don't fail the request
    console.error('Google Sheets error:', err);
  }

  // TODO: trigger payment processing (Pix / card / PayPal)
  // TODO: send confirmation email

  return res.status(201).json({
    orderId,
    status: 'pending',
    message: 'Pedido criado com sucesso',
  });
}
