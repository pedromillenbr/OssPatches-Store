import type { NextApiRequest, NextApiResponse } from 'next';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { applyPaymentStatus } from '@/lib/paymentSync';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('order-status', req, res)) return;

  const { mpPaymentId } = req.query;

  // IDs de pagamento do Mercado Pago são sempre numéricos. Validar o formato
  // evita injetar lixo na URL da API do MP.
  if (!mpPaymentId || typeof mpPaymentId !== 'string' || !/^\d+$/.test(mpPaymentId)) {
    return res.status(400).json({ error: 'Missing or invalid mpPaymentId' });
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

    // Rede de segurança do webhook: a tela do cliente consulta aqui enquanto
    // espera o Pix. Se o dinheiro entrou, o pedido vira "pago" no painel e na
    // planilha agora, sem depender do aviso do Mercado Pago chegar. Status e
    // número do pedido vêm da API do MP, não de quem chamou.
    if (data.status === 'approved' && typeof data.external_reference === 'string' && data.external_reference) {
      try {
        await applyPaymentStatus(data.external_reference, 'approved', mpPaymentId);
      } catch (err) {
        console.error('[order-status] sync:', err);
      }
    }

    // approved = pago, pending = aguardando, cancelled/rejected = falhou.
    // statusDetail distingue o 3DS ainda em andamento (pending_challenge) de
    // outros "pending".
    return res.status(200).json({
      status: data.status as string,
      statusDetail: (data.status_detail ?? '') as string,
    });
  } catch (err) {
    console.error('Payment status error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
