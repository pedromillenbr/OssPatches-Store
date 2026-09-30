import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrdersByEmailFromSheet } from '@/services/googleSheets';
import { importSheetOrders } from '@/lib/importSheetOrders';
import { getSessionUser } from '@/lib/sessionUser';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { handleCors } from '@/lib/cors';

/**
 * Traz para a conta do cliente os pedidos que ele fez ANTES desta correção.
 *
 * Até aqui o pedido só entrava no Banco de Dados se o navegador chegasse na
 * tela de sucesso já logado. Quem comprou como convidado, ou pagou o Pix no
 * app do banco e fechou a aba, ficou com a conta vazia mesmo tendo pago. O
 * pedido nunca se perdeu — ele está no controle interno. Esta rota vai lá,
 * pega os pedidos do e-mail da conta e grava os que faltam.
 *
 * Segurança: o e-mail vem da sessão conferida no servidor, nunca do corpo da
 * requisição — ninguém importa pedido do e-mail de outra pessoa. E só
 * inserimos o que falta: pedido já existente nunca é sobrescrito, então isto
 * não serve para rebaixar status nem alterar valores.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('order-import', req, res)) return;

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login para ver seus pedidos.' });

  try {
    const sheetOrders = await getOrdersByEmailFromSheet(user.email);
    const imported = await importSheetOrders(sheetOrders, user.id);
    if (imported) console.log(`[import-mine] ${user.email}: ${imported} pedido(s)`);
    return res.status(200).json({ imported });
  } catch (err) {
    // Falhar aqui não pode quebrar a página "Meus pedidos".
    console.error('[import-mine] inesperado:', err);
    return res.status(200).json({ imported: 0 });
  }
}
