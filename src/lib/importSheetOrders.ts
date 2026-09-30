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
      'order_ref, customer_name, customer_phone, customer_email, payment_method, ' +
        'shipping_method, address, items'
    )
    .in('order_ref', orders.map((o) => o.id));

  const rows0 = (existing ?? []) as unknown as ExistingRow[];
  const known = new Set(rows0.map((r) => r.order_ref));

  // Pedido que já está aqui mas entrou sem os dados do cliente (importação
  // antiga, ou espelho gravado antes destas colunas existirem). Preenchemos
  // SÓ o que está em branco — status, rastreio e valores ficam como estão,
  // porque podem ter sido ajustados à mão no painel.
  await fillBlanks(admin, rows0, orders);

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
      // O total é o que o cliente pagou. Frete e desconto vêm das colunas
      // novas; nos pedidos antigos elas estão vazias e ficam zeradas.
      subtotal: Math.round((o.total - o.shippingCost + o.discountAmount) * 100) / 100,
      shipping_cost: o.shippingCost,
      discount_amount: o.discountAmount,
      total: o.total,
      items: o.items,
      address: addressFrom(o),
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
  address: Record<string, unknown> | null;
  items: ({ details?: string; customization?: unknown } | null)[] | null;
}

/**
 * O endereço possível a partir da planilha.
 *
 * A planilha guarda CEP, número e complemento — rua, bairro e cidade saem do
 * CEP. É o suficiente para postar; o painel mostra o que existe e não inventa
 * o resto.
 */
function addressFrom(o: SheetOrderSummary): Record<string, string> | null {
  if (!o.zipCode && !o.number) return null;
  return {
    zipCode: o.zipCode,
    number: o.number,
    complement: o.complement,
  };
}

/**
 * Completa os dados do cliente nos pedidos que já estão no painel.
 *
 * Nunca sobrescreve: só preenche coluna vazia. Assim a importação pode rodar
 * quantas vezes for preciso sem desfazer nada que a loja tenha corrigido.
 */
async function fillBlanks(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  existing: ExistingRow[],
  orders: SheetOrderSummary[]
): Promise<void> {
  const bySheetRef = new Map(orders.map((o) => [o.id, o]));

  for (const raw of existing) {
    const sheet = bySheetRef.get(raw.order_ref);
    if (!sheet) continue;

    const patch: Record<string, unknown> = {};
    if (!raw.customer_name && sheet.name) patch.customer_name = sheet.name;
    if (!raw.customer_phone && sheet.phone) patch.customer_phone = sheet.phone;
    if (!raw.customer_email && sheet.email) {
      patch.customer_email = sheet.email.trim().toLowerCase();
    }
    if (!raw.payment_method && sheet.paymentMethod) patch.payment_method = sheet.paymentMethod;
    if (!raw.shipping_method && sheet.carrier) patch.shipping_method = sheet.carrier;
    if (!raw.address) patch.address = addressFrom(sheet);

    // Pedidos recuperados antes entraram sem a personalização de cada item —
    // justamente o que a produção precisa ler.
    const semDetalhe = (raw.items ?? []).every(
      (i) => !i || (!i.details && !i.customization)
    );
    if (semDetalhe && sheet.items.some((i) => i.details)) patch.items = sheet.items;

    if (Object.keys(patch).length === 0) continue;

    const { error } = await admin.from('orders').update(patch).eq('order_ref', raw.order_ref);
    if (error) console.error(`[importSheetOrders] ${raw.order_ref}:`, error.message);
  }
}
