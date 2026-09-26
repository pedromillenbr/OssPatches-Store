import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Marca o pedido do cliente como "Pagamento confirmado" no Banco de Dados.
 *
 * Por que existe: o pedido é espelhado na conta do cliente sempre como
 * "pending" (é o próprio banco que força isso na inserção, para ninguém se
 * declarar pago). Quem sabe de verdade se o pagamento entrou é o gateway —
 * então a confirmação precisa vir do servidor, com a chave de serviço.
 *
 * Só avança de `pending` para `confirmed`. Nunca rebaixa um pedido que o
 * admin já moveu para "Em produção"/"Enviado"/"Entregue", mesmo que o
 * Mercado Pago reentregue o mesmo webhook dias depois.
 *
 * Nunca lança: uma falha aqui não pode derrubar o webhook (o Mercado Pago
 * reenviaria o evento em loop) nem a tela de sucesso do cliente.
 */
export async function markOrderPaidInDb(orderRef: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  try {
    const { data, error } = await admin
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('order_ref', orderRef)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      console.error(`[orderPaymentSync] ${orderRef}:`, error.message);
      return;
    }

    // 0 linhas é normal e esperado: pedido de convidado (não existe no banco)
    // ou pedido que o admin já adiantou para um status posterior.
    if (data?.length) {
      console.log(`[orderPaymentSync] ${orderRef} → confirmed`);
    }
  } catch (err) {
    console.error(`[orderPaymentSync] ${orderRef} (inesperado):`, err);
  }
}
