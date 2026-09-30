import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllOrdersFromSheet } from '@/services/googleSheets';
import { importSheetOrders } from '@/lib/importSheetOrders';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { handleCors } from '@/lib/cors';

/**
 * Reconstrói a lista de pedidos do painel a partir do controle interno.
 *
 * Existe porque, até a correção, o pedido só era gravado no Banco de Dados
 * pelo navegador do cliente na tela de sucesso — então o painel nunca viu os
 * pedidos de quem comprou sem conta ou pagou o Pix fora do site. Tudo está na
 * planilha; esta rota traz de volta o que falta.
 *
 * Pode rodar quantas vezes quiser: pedido já existente não é tocado, então
 * status e rastreio que você ajustou à mão no painel ficam como estão.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  try {
    const sheetOrders = await getAllOrdersFromSheet();
    const imported = await importSheetOrders(sheetOrders);
    console.log(`[admin/import-orders] ${imported} de ${sheetOrders.length} pedido(s)`);
    return res.status(200).json({ imported, found: sheetOrders.length });
  } catch (err) {
    console.error('[admin/import-orders]', err);
    return res.status(502).json({ error: 'Não foi possível ler o controle interno agora.' });
  }
}
