import type { NextApiRequest, NextApiResponse } from 'next';
import { markOrderDeletedInSheet } from '@/services/googleSheets';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { ORDER_ID_REGEX } from '@/lib/checkoutGuards';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';

/**
 * Exclui o pedido do painel (pedido de teste, duplicado, cancelado).
 *
 * Some do Banco de Dados — e com isso do painel e do "Meus pedidos" do
 * cliente. Na planilha a linha fica, com a etapa "Excluído": ela é o registro
 * da venda, e é essa marca que impede o "Importar pedidos" de trazê-lo de volta.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  if (isBodyTooLarge(req, 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const orderRef = typeof req.body?.orderRef === 'string' ? req.body.orderRef.trim() : '';
  if (!ORDER_ID_REGEX.test(orderRef)) {
    return res.status(400).json({ error: 'Número de pedido inválido' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Banco de Dados não configurado no servidor.' });
  }

  // Planilha primeiro: se ela falhar depois do banco, o próximo "Importar
  // pedidos" ressuscitaria o pedido sem ninguém perceber.
  const sheetRows = await markOrderDeletedInSheet(orderRef);

  const { error } = await admin.from('orders').delete().eq('order_ref', orderRef);
  if (error) {
    console.error('[admin/order-delete]', error.message);
    return res.status(500).json({ error: 'Não foi possível excluir o pedido.' });
  }

  console.log(`[admin/order-delete] ${orderRef} excluído (planilha: ${sheetRows} linha(s))`);
  return res.status(200).json({ ok: true, sheetRows });
}
