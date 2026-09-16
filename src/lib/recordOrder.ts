import { supabase } from '@/lib/supabase';
import type { CartItem, Address, ShippingOption } from '@/types';

interface RecordOrderInput {
  orderRef: string;
  items: CartItem[];
  address: Address | null;
  shipping: ShippingOption | null;
  subtotal: number;
  discountAmount: number;
  currency: string;
}

/**
 * Grava um espelho leve do pedido no Supabase, vinculado ao usuário logado,
 * para aparecer na aba "Meus pedidos". Só roda se houver sessão — clientes
 * que compram sem conta continuam com o fluxo normal (Google Sheets + e-mail).
 *
 * Nunca lança erro para não atrapalhar a tela de sucesso: em caso de falha,
 * apenas registra no console. O RLS garante que só o dono grava seu pedido.
 */
export async function recordOrderForUser(input: RecordOrderInput): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return; // convidado — nada a fazer

    const shippingCost = input.shipping?.price ?? 0;
    const total =
      Math.round((input.subtotal - input.discountAmount + shippingCost) * 100) / 100;

    // Guardamos só o essencial de cada item (nome, qtd, imagem, preço)
    const items = input.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
      slug: i.slug,
    }));

    // upsert por order_ref evita duplicar se o componente remontar
    const { error } = await supabase.from('orders').upsert(
      {
        user_id: user.id,
        order_ref: input.orderRef,
        status: 'pending',
        currency: input.currency,
        subtotal: input.subtotal,
        shipping_cost: shippingCost,
        discount_amount: input.discountAmount,
        total,
        items,
        address: input.address,
      },
      { onConflict: 'order_ref' }
    );

    if (error) console.error('recordOrderForUser:', error.message);
  } catch (err) {
    console.error('recordOrderForUser (inesperado):', err);
  }
}
