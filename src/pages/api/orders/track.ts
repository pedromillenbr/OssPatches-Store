import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrderFromSheet } from '@/services/googleSheets';
import { ORDER_ID_REGEX } from '@/lib/checkoutGuards';
import { statusFromShippingStage } from '@/lib/orderStatus';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';

/**
 * Consulta pública de pedido, para quem comprou sem criar conta.
 *
 * O e-mail faz o papel de senha: só devolvemos o pedido para quem já sabe o
 * número E o e-mail usado na compra. Por isso a resposta é deliberadamente
 * enxuta — situação, etapa do envio e rastreio. Nada de nome, endereço,
 * telefone ou valor: quem quiser esses dados entra na conta.
 *
 * Pedido inexistente e e-mail errado devolvem exatamente a mesma resposta, e
 * no mesmo formato, para não servir de sonda ("esse pedido existe?").
 */

interface TrackResponse {
  found: boolean;
  /** Status interno do pedido ('pending' | 'confirmed'). */
  status?: string;
  /** Etapa do envio preenchida pela loja ('Postado', 'A caminho'…). */
  shippingStage?: string;
  /** Código de rastreio, quando for só código. */
  trackingCode?: string;
  /** Link de rastreio, quando a loja colou a URL da transportadora. */
  trackingUrl?: string;
  /** Data da compra, como gravada no pedido. */
  createdAt?: string;
}

const NOT_FOUND: TrackResponse = { found: false };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrackResponse | { error: string }>
) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('order-track', req, res)) return;

  if (isBodyTooLarge(req, 2 * 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const orderRef =
    typeof req.body?.orderRef === 'string' ? req.body.orderRef.trim().toUpperCase() : '';
  const email =
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!ORDER_ID_REGEX.test(orderRef) || !email.includes('@')) {
    return res.status(400).json({ error: 'Informe o número do pedido e o e-mail da compra.' });
  }

  try {
    const order = await getOrderFromSheet(orderRef);

    // Mesma resposta para "não existe" e "e-mail não confere".
    if (!order || (order.customer?.email ?? '').trim().toLowerCase() !== email) {
      return res.status(200).json(NOT_FOUND);
    }

    const tracking = (order.tracking ?? '').trim();
    const isUrl = /^https?:\/\//i.test(tracking);

    const stage = (order.shippingStage ?? '').trim();

    return res.status(200).json({
      found: true,
      // A etapa de envio preenchida pela loja avança a linha do tempo além de
      // "Pago", que é o máximo que o gateway sabe informar.
      status: statusFromShippingStage(order.status ?? 'pending', stage),
      shippingStage: stage || undefined,
      trackingCode: tracking && !isUrl ? tracking : undefined,
      trackingUrl: isUrl ? tracking : undefined,
      createdAt: order.createdAt,
    });
  } catch (err) {
    console.error('[track] Erro ao consultar pedido:', err);
    return res.status(500).json({ error: 'Não foi possível consultar agora. Tente em instantes.' });
  }
}
