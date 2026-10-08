import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { formatCPF } from '@/lib/cpf';
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
    // Guardamos a personalização junto: é o que o painel precisa mostrar para
    // produzir (tamanho, graus, nome bordado, arte do patch).
    const items = (order.items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
      slug: i.slug,
      customization: i.customization ?? null,
    }));

    const shipping = order.shipping
      ? [
          [order.shipping.company, order.shipping.name].filter(Boolean).join(' '),
          order.shipping.days,
        ]
          .filter(Boolean)
          .join(' - ')
      : null;

    const email = (order.customer?.email || '').trim().toLowerCase();

    const row = {
      user_id: userId ?? null,
      customer_email: email || null,
      customer_name: order.customer?.name || null,
      customer_phone: order.customer?.phone || null,
      payment_method: order.payment?.method || null,
      shipping_method: shipping,
      order_ref: order.id,
      status: 'pending',
      currency: order.currency,
      subtotal: order.subtotal,
      shipping_cost: order.shippingCost,
      discount_amount: order.discountAmount ?? 0,
      total: order.total,
      items,
      address: order.address,
    };
    const cpf = order.customer?.cpf ? formatCPF(order.customer.cpf) : null;

    // ignoreDuplicates: se a linha já existe (retentativa, webhook rápido),
    // não sobrescrevemos — senão um pedido já confirmado voltaria a 'pending'.
    const options = { onConflict: 'order_ref', ignoreDuplicates: true };
    let { error } = await admin.from('orders').upsert({ ...row, customer_cpf: cpf }, options);

    // A coluna do CPF só existe depois de rodar supabase/orders_cpf.sql. Até
    // lá gravamos o pedido sem ela — perder o CPF no painel é ruim, perder o
    // pedido inteiro é muito pior.
    if (error && /customer_cpf/.test(error.message)) {
      ({ error } = await admin.from('orders').upsert(row, options));
    }

    if (error) {
      console.error(`[orderMirror] ${order.id}:`, error.message);
    }
  } catch (err) {
    console.error(`[orderMirror] ${order.id} (inesperado):`, err);
  }
}
