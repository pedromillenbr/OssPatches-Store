import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { FUNNEL_STEPS, type FunnelStep } from '@/lib/funnel';

/**
 * Números do funil para o painel (/admin/funil).
 *
 * - steps: quantos visitantes diferentes chegaram a cada etapa no período.
 * - orders: pedidos criados no período, pagos e não pagos. "Pago" vem do Banco
 *   de Dados, não do navegador — conta até quem pagou o Pix com a aba fechada.
 * - abandoned: quem deixou o e-mail e não comprou, com a etapa onde parou.
 */

const PERIODS = [1, 7, 30, 90] as const;
const MAX_EVENT_ROWS = 50_000;

/** "YYYY-MM-DD" de N-1 dias atrás, no horário de Brasília (1 = só hoje). */
function startDay(days: number): string {
  const d = new Date(Date.now() - (days - 1) * 86_400_000);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Banco de Dados não configurado no servidor.' });
  }

  const requested = Number(req.query.days);
  const days = (PERIODS as readonly number[]).includes(requested) ? requested : 7;
  const since = startDay(days);
  // Meia-noite de Brasília do primeiro dia, para filtrar created_at.
  const sinceIso = new Date(`${since}T00:00:00-03:00`).toISOString();

  const [events, orders, carts] = await Promise.all([
    admin.from('checkout_events').select('visitor_id, step').gte('day', since).limit(MAX_EVENT_ROWS),
    admin.from('orders').select('status').gte('created_at', sinceIso).limit(10_000),
    admin
      .from('abandoned_carts')
      .select('name, email, items, subtotal, currency, created_at, emailed_at, recovered_at, unsubscribed, visitor_id')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  // Sem a tabela do funil ainda (SQL não rodado), o resto do painel funciona.
  const setupMissing = !!events.error && /checkout_events/.test(events.error.message);
  if (events.error && !setupMissing) console.error('[admin/funnel] events:', events.error.message);
  if (orders.error) console.error('[admin/funnel] orders:', orders.error.message);

  const visitors: Record<FunnelStep, Set<string>> = Object.fromEntries(
    FUNNEL_STEPS.map((s) => [s, new Set<string>()])
  ) as Record<FunnelStep, Set<string>>;
  for (const row of events.data ?? []) {
    visitors[row.step as FunnelStep]?.add(row.visitor_id);
  }

  const orderRows = orders.data ?? [];
  const paid = orderRows.filter((o) => o.status !== 'pending').length;

  // Etapa mais longe de cada visitante que abandonou (todas as datas: a pessoa
  // pode ter começado num dia e parado no outro).
  let cartRows = carts.data ?? [];
  if (carts.error) {
    // Banco sem a coluna visitor_id ainda: busca sem ela.
    const retry = await admin
      .from('abandoned_carts')
      .select('name, email, items, subtotal, currency, created_at, emailed_at, recovered_at, unsubscribed')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(200);
    if (retry.error) console.error('[admin/funnel] carts:', retry.error.message);
    cartRows = (retry.data ?? []).map((c) => ({ ...c, visitor_id: null }));
  }

  const ids = cartRows.map((c) => c.visitor_id).filter((v): v is string => !!v);
  const furthest = new Map<string, number>();
  if (ids.length > 0 && !setupMissing) {
    const { data } = await admin.from('checkout_events').select('visitor_id, step').in('visitor_id', ids).limit(5_000);
    for (const row of data ?? []) {
      const rank = FUNNEL_STEPS.indexOf(row.step as FunnelStep);
      if (rank > (furthest.get(row.visitor_id) ?? -1)) furthest.set(row.visitor_id, rank);
    }
  }

  const abandoned = cartRows.map((c) => {
    const rank = c.visitor_id ? furthest.get(c.visitor_id) : undefined;
    const items = Array.isArray(c.items) ? c.items : [];
    return {
      name: c.name,
      email: c.email,
      items: items.map((i: { name?: unknown; quantity?: unknown }) => `${Number(i?.quantity) || 1}× ${String(i?.name ?? '')}`),
      subtotal: Number(c.subtotal) || 0,
      currency: c.currency,
      createdAt: c.created_at,
      emailedAt: c.emailed_at,
      recoveredAt: c.recovered_at,
      unsubscribed: c.unsubscribed,
      lastStep: rank !== undefined && rank >= 0 ? FUNNEL_STEPS[rank] : null,
    };
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    days,
    since,
    setupMissing,
    steps: FUNNEL_STEPS.map((s) => ({ step: s, visitors: visitors[s].size })),
    orders: { total: orderRows.length, paid, unpaid: orderRows.length - paid },
    abandoned,
  });
}
