import type { NextApiRequest, NextApiResponse } from 'next';
import { rejectIfRateLimited } from '@/lib/rateLimit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('order-status', req, res)) return;

  const { mpPaymentId } = req.query;

  if (!mpPaymentId || typeof mpPaymentId !== 'string') {
    return res.status(400).json({ error: 'Missing mpPaymentId' });
  }

  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!mpRes.ok) {
      return res.status(502).json({ error: 'Erro ao consultar pagamento' });
    }

    const data = await mpRes.json();

    // approved = pago, pending = aguardando, cancelled/rejected = falhou
    return res.status(200).json({ status: data.status as string });
  } catch (err) {
    console.error('Payment status error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
