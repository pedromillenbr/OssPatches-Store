import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { Order } from '@/types';

/**
 * Grava o pedido no Banco de Dados, no servidor, no instante em que ele é
 * criado — é isto que faz o pedido aparecer em "Meus pedidos".
 *
 * Por que no servidor: antes quem gravava era o navegador, na última tela do
 * checkout. Quem comprava sem conta, ou pagava o Pix no app do banco e fechava
 * a aba, nunca chegava nessa tela — e o pedido sumia da conta do cliente,
 * mesmo pago e confirmado. Aqui não tem como escapar: se o pedido existe, a
 * linha existe.
 *
 * Guardamos o e-mail da compra junto. É ele que liga o pedido à conta quando a
 * pessoa compra como convidado e cria a conta depois.
 *
 * O pedido nasce sempre 'pending'. Quem confirma o pagamento é o gateway, via
 * markOrderPaidInDb — nunca o que o navegador disse.
 *
 * Nunca lança: uma falha aqui não pode derrubar a compra. O cliente já pagou.
 */
export async function mirrorOrderToDb(
  order: Order,
  userId?: string | null
): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  try {
    // Só o essencial de cada item — o detalhe completo vive na planilha.
    const items = (order.items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
      slug: i.slug,
    }));

    const email = (order.customer?.email || '').trim().toLowerCase();

    // ignoreDuplicates: se a linha já existe (retentativa, webhook rápido),
    // não sobrescrevemos — senão um pedido já confirmado voltaria a 'pending'.
    const { error } = await admin.from('orders').upsert(
      {
        user_id: userId ?? null,
        customer_email: email || null,
        order_ref: order.id,
        status: 'pending',
        currency: order.currency,
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        discount_amount: order.discountAmount ?? 0,
        total: order.total,
        items,
        address: order.address,
      },
      { onConflict: 'order_ref', ignoreDuplicates: true }
    );

    if (error) {
      console.error(`[orderMirror] ${order.id}:`, error.message);
    }
  } catch (err) {
    console.error(`[orderMirror] ${order.id} (inesperado):`, err);
  }
}
