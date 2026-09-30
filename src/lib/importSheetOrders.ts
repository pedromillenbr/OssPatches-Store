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
    .select(
      'order_ref, customer_name, customer_phone, customer_email, payment_method, shipping_method'
    )
    .in('order_ref', orders.map((o) => o.id));

  const known = new Set((existing ?? []).map((r) => r.order_ref as string));

  // Pedido que já está aqui mas entrou sem os dados do cliente (importação
  // antiga, ou espelho gravado antes destas colunas existirem). Preenchemos
  // SÓ o que está em branco — status, rastreio e valores ficam como estão,
  // porque podem ter sido ajustados à mão no painel.
  await fillBlanks(admin, existing ?? [], orders);

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
      customer_name: o.name || null,
      customer_phone: o.phone || null,
      payment_method: o.paymentMethod || null,
      shipping_method: o.carrier || null,
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

/** Linha do banco com os campos de identificação que podem estar em branco. */
interface ExistingRow {
  order_ref: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  payment_method: string | null;
  shipping_method: string | null;
}

/**
 * Completa os dados do cliente nos pedidos que já estão no painel.
 *
 * Nunca sobrescreve: só preenche coluna vazia. Assim a importação pode rodar
 * quantas vezes for preciso sem desfazer nada que a loja tenha corrigido.
 */
async function fillBlanks(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  existing: unknown[],
  orders: SheetOrderSummary[]
): Promise<void> {
  const bySheetRef = new Map(orders.map((o) => [o.id, o]));

  for (const raw of existing as ExistingRow[]) {
    const sheet = bySheetRef.get(raw.order_ref);
    if (!sheet) continue;

    const patch: Record<string, string> = {};
    if (!raw.customer_name && sheet.name) patch.customer_name = sheet.name;
    if (!raw.customer_phone && sheet.phone) patch.customer_phone = sheet.phone;
    if (!raw.customer_email && sheet.email) {
      patch.customer_email = sheet.email.trim().toLowerCase();
    }
    if (!raw.payment_method && sheet.paymentMethod) patch.payment_method = sheet.paymentMethod;
    if (!raw.shipping_method && sheet.carrier) patch.shipping_method = sheet.carrier;

    if (Object.keys(patch).length === 0) continue;

    const { error } = await admin.from('orders').update(patch).eq('order_ref', raw.order_ref);
    if (error) console.error(`[importSheetOrders] ${raw.order_ref}:`, error.message);
  }
}
