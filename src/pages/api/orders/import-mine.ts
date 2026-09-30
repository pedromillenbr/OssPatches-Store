import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrdersByEmailFromSheet } from '@/services/googleSheets';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSessionUser } from '@/lib/sessionUser';
import { statusFromShippingStage } from '@/lib/orderStatus';
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

/** Status do gateway que significam "o dinheiro entrou". */
const PAID = new Set(['approved', 'processing', 'shipped', 'delivered']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('order-import', req, res)) return;

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login para ver seus pedidos.' });

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(200).json({ imported: 0 });

  try {
    const sheetOrders = await getOrdersByEmailFromSheet(user.email);
    if (!sheetOrders.length) return res.status(200).json({ imported: 0 });

    // Quais já estão no banco? Só inserimos o que falta.
    const refs = sheetOrders.map((o) => o.id);
    const { data: existing } = await admin
      .from('orders')
      .select('order_ref')
      .in('order_ref', refs);

    const known = new Set((existing ?? []).map((r) => r.order_ref as string));
    const missing = sheetOrders.filter((o) => !known.has(o.id));
    if (!missing.length) return res.status(200).json({ imported: 0 });

    const rows = missing.map((o) => {
      const paid = PAID.has(o.gatewayStatus);
      // A coluna "Envio", preenchida à mão pela loja, é o que diz se já saiu
      // da produção. Sem pagamento confirmado nada avança.
      const status = paid
        ? statusFromShippingStage('confirmed', o.shippingStage)
        : 'pending';
      const isUrl = /^https?:\/\//i.test(o.tracking.trim());

      return {
        user_id: user.id,
        customer_email: user.email,
        order_ref: o.id,
        status,
        currency: o.currency,
        subtotal: o.total,
        shipping_cost: 0,
        discount_amount: 0,
        total: o.total,
        items: o.items,
        address: null,
        tracking_code: !isUrl && o.tracking.trim() ? o.tracking.trim() : null,
        tracking_url: isUrl ? o.tracking.trim() : null,
        ...(o.createdAt ? { created_at: o.createdAt } : {}),
      };
    });

    const { error } = await admin
      .from('orders')
      .upsert(rows, { onConflict: 'order_ref', ignoreDuplicates: true });

    if (error) {
      console.error('[import-mine]', error.message);
      return res.status(200).json({ imported: 0 });
    }

    console.log(`[import-mine] ${user.email}: ${rows.length} pedido(s) recuperado(s)`);
    return res.status(200).json({ imported: rows.length });
  } catch (err) {
    // Falhar aqui não pode quebrar a página "Meus pedidos".
    console.error('[import-mine] inesperado:', err);
    return res.status(200).json({ imported: 0 });
  }
}
