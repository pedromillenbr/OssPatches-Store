import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { statusFromShippingStage } from '@/lib/orderStatus';
import type { SheetOrderSummary } from '@/services/googleSheets';

/** Status do gateway que significam "o dinheiro entrou". */
const PAID = new Set(['approved', 'processing', 'shipped', 'delivered']);

/**
 * Grava no Banco de Dados os pedidos da planilha que ainda não estão lá.
 *
 * Nunca sobrescreve pedido existente: se o número já está no banco, ele fica
 * como está. Então rodar duas vezes não desfaz nada que a loja já ajustou à
 * mão no painel.
 *
 * `userId` só é preenchido quando quem pede é o próprio dono do e-mail. Na
 * importação geral do admin fica vazio — o cliente passa a enxergar o pedido
 * pelo e-mail da compra, assim que entrar na conta dele.
 */
export async function importSheetOrders(
  orders: SheetOrderSummary[],
  userId?: string | null
): Promise<number> {
  const admin = getSupabaseAdmin();
  if (!admin || !orders.length) return 0;

  // Quais já estão no banco? Só inserimos o que falta.
  const { data: existing } = await admin
    .from('orders')
    .select('order_ref')
    .in('order_ref', orders.map((o) => o.id));

  const known = new Set((existing ?? []).map((r) => r.order_ref as string));
  const missing = orders.filter((o) => !known.has(o.id));
  if (!missing.length) return 0;

  const rows = missing.map((o) => {
    const paid = PAID.has(o.gatewayStatus);
    // A coluna "Envio", preenchida à mão pela loja, é o que diz se já saiu da
    // produção. O pagamento manda: sem ele confirmado, nada avança.
    const status = paid ? statusFromShippingStage('confirmed', o.shippingStage) : 'pending';
    const tracking = o.tracking.trim();
    const isUrl = /^https?:\/\//i.test(tracking);

    return {
      user_id: userId ?? null,
      customer_email: o.email.trim().toLowerCase() || null,
      order_ref: o.id,
      status,
      currency: o.currency,
      subtotal: o.total,
      shipping_cost: 0,
      discount_amount: 0,
      total: o.total,
      items: o.items,
      address: null,
      tracking_code: tracking && !isUrl ? tracking : null,
      tracking_url: isUrl ? tracking : null,
      ...(o.createdAt ? { created_at: o.createdAt } : {}),
    };
  });

  const { error } = await admin
    .from('orders')
    .upsert(rows, { onConflict: 'order_ref', ignoreDuplicates: true });

  if (error) {
    console.error('[importSheetOrders]', error.message);
    return 0;
  }

  return rows.length;
}
