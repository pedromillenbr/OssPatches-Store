import type { NextApiRequest, NextApiResponse } from 'next';
import { updateOrderShippingInSheet } from '@/services/googleSheets';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { ORDER_ID_REGEX } from '@/lib/checkoutGuards';
import { ALL_STATUSES } from '@/lib/orderStatus';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';

/**
 * Salva a alteração do pedido nos DOIS lugares: painel e planilha.
 *
 * Existe porque as duas telas mostravam a mesma venda de formas diferentes —
 * o painel dizia "Em produção" e a planilha continuava em branco. Agora uma
 * edição só atualiza os dois, e a resposta avisa se a planilha não aceitou.
 *
 * A coluna "Status" da planilha não é tocada: ela é do gateway de pagamento.
 * O que a loja controla à mão é a etapa do envio e o rastreio.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  if (isBodyTooLarge(req, 4 * 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const orderRef = typeof req.body?.orderRef === 'string' ? req.body.orderRef.trim() : '';
  const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
  const trackingCode =
    typeof req.body?.trackingCode === 'string' ? req.body.trackingCode.trim() : '';
  const trackingUrl =
    typeof req.body?.trackingUrl === 'string' ? req.body.trackingUrl.trim() : '';

  if (!ORDER_ID_REGEX.test(orderRef)) {
    return res.status(400).json({ error: 'Número de pedido inválido' });
  }
  if (!ALL_STATUSES.includes(status as never)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Banco de Dados não configurado no servidor.' });
  }

  const { error } = await admin
    .from('orders')
    .update({
      status,
      tracking_code: trackingCode || null,
      tracking_url: trackingUrl || null,
    })
    .eq('order_ref', orderRef);

  if (error) {
    console.error('[admin/order-update]', error.message);
    return res.status(500).json({ error: 'Não foi possível salvar o pedido.' });
  }

  // A planilha é o controle interno — se ela falhar, o pedido já está salvo no
  // painel e avisamos para a loja não achar que sincronizou.
  const rows = await updateOrderShippingInSheet(orderRef, status, trackingUrl || trackingCode);

  return res.status(200).json({ ok: true, sheetRows: rows });
}
