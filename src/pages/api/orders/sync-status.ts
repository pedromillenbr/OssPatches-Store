import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrderFromSheet } from '@/services/googleSheets';
import { markOrderPaidInDb } from '@/lib/orderPaymentSync';
import { ORDER_ID_REGEX } from '@/lib/checkoutGuards';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';

/**
 * Acerta o status do pedido na conta do cliente logo depois da compra.
 *
 * Por que é preciso além do webhook: no cartão e no PayPal o pagamento já sai
 * aprovado, e o webhook do Mercado Pago pode chegar ANTES de o pedido ser
 * espelhado na conta do cliente — nesse caso ele não teria o que atualizar.
 * A tela de sucesso chama esta rota logo após criar o espelho, fechando a
 * janela entre os dois eventos.
 *
 * Segurança: o cliente só manda o número do pedido. Quem decide se está pago
 * é o controle interno, e o único destino possível é "Pagamento confirmado" —
 * não dá para forjar envio, entrega nem valor. A resposta é sempre a mesma,
 * então também não serve para descobrir se um pedido alheio foi pago.
 */

/** Status do gateway que significam "o dinheiro entrou". */
const PAID_STATUSES = new Set(['approved', 'processing', 'shipped', 'delivered']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('order-status', req, res)) return;

  if (isBodyTooLarge(req, 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const orderRef = typeof req.body?.orderRef === 'string' ? req.body.orderRef.trim() : '';
  if (!ORDER_ID_REGEX.test(orderRef)) {
    return res.status(400).json({ error: 'Número de pedido inválido' });
  }

  try {
    const order = await getOrderFromSheet(orderRef);
    if (order && PAID_STATUSES.has(order.gatewayStatus ?? '')) {
      await markOrderPaidInDb(orderRef);
    }
  } catch (err) {
    // Falhar aqui não pode quebrar a tela de sucesso do cliente: o webhook
    // ainda vai corrigir o status quando chegar.
    console.error('[sync-status] Erro ao sincronizar', orderRef, err);
  }

  // Resposta sempre igual, para não revelar nada sobre pedidos de terceiros.
  return res.status(200).json({ ok: true });
}
