import { useCallback, useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/services/products';
import type { FunnelStep } from '@/lib/funnel';

interface FunnelData {
  days: number;
  since: string;
  setupMissing: boolean;
  steps: { step: FunnelStep; visitors: number }[];
  orders: { total: number; paid: number; unpaid: number };
  abandoned: {
    name: string | null;
    email: string;
    items: string[];
    subtotal: number;
    currency: string;
    createdAt: string;
    emailedAt: string | null;
    recoveredAt: string | null;
    unsubscribed: boolean;
    lastStep: FunnelStep | null;
  }[];
}

const STEP_LABEL: Record<FunnelStep | 'pago', string> = {
  produto: 'Viu um produto',
  carrinho: 'Colocou no carrinho',
  checkout: 'Abriu o checkout',
  dados: 'Preencheu os dados',
  endereco: 'Preencheu o endereço',
  frete: 'Escolheu o frete',
  pagamento: 'Clicou em pagar',
  pago: 'Pagou',
};

/** Etapa mais longe que a pessoa concluiu → etapa onde ela parou. */
const STOPPED_AT: Record<FunnelStep, string> = {
  produto: 'Seus dados',
  carrinho: 'Seus dados',
  checkout: 'Seus dados',
  dados: 'Endereço',
  endereco: 'Frete',
  frete: 'Pagamento',
  pagamento: 'Tentou pagar e não concluiu',
};

const PERIODS = [
  { days: 1, label: 'Hoje' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
];

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export default function AdminFunnelPage() {
  const { ready } = useRequireAdmin();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<FunnelData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (period: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/funnel?days=${period}`, { headers: await authHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível carregar o funil');
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o funil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load(days);
  }, [ready, days, load]);

  if (!ready) return null;

  // Linhas do funil: as etapas do site + "Pagou", que vem dos pedidos.
  const rows = data
    ? [
        ...data.steps.map((s) => ({ key: s.step as FunnelStep | 'pago', count: s.visitors })),
        { key: 'pago' as const, count: data.orders.paid },
      ]
    : [];
  const top = Math.max(1, ...rows.map((r) => r.count));

  // Maior queda entre duas etapas seguidas — é onde vale olhar primeiro.
  let worstIndex = -1;
  let worstLoss = 0;
  rows.forEach((row, i) => {
    if (i === 0) return;
    const prev = rows[i - 1].count;
    const loss = prev - row.count;
    if (prev > 0 && loss > worstLoss) {
      worstLoss = loss;
      worstIndex = i;
    }
  });

  return (
    <>
      <NextSeo title="Funil | Admin" noindex nofollow />
      <Layout showFooter={false}>
        <AdminLayout title="Funil de vendas">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDays(p.days)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  days === p.days
                    ? 'border-brand-black bg-brand-black text-white'
                    : 'border-brand-gray-200 text-brand-gray-600 hover:border-brand-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {loading && !data ? (
            <p className="mt-8 text-sm text-brand-gray-500">Carregando…</p>
          ) : error ? (
            <p className="mt-8 text-sm text-red-600">{error}</p>
          ) : data ? (
            <div className={loading ? 'opacity-60 transition-opacity' : ''}>
              {data.setupMissing && (
                <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  A contagem das etapas ainda não foi ligada no Banco de Dados. Por enquanto só aparecem os pedidos e
                  os carrinhos abandonados.
                </p>
              )}

              {/* Funil */}
              <section className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wide text-brand-gray-500">
                  Quantas pessoas chegaram em cada etapa
                </h2>
                <ol className="mt-4 space-y-1">
                  {rows.map((row, i) => {
                    const prev = i > 0 ? rows[i - 1].count : 0;
                    const lost = i > 0 ? Math.max(0, prev - row.count) : 0;
                    const lostPct = prev > 0 ? Math.round((lost / prev) * 100) : 0;
                    const worst = i === worstIndex;
                    return (
                      <li key={row.key}>
                        {i > 0 && lost > 0 && (
                          <p className={`py-1 pl-3 text-xs ${worst ? 'font-bold text-red-600' : 'text-brand-gray-500'}`}>
                            ↓ {lost} {lost === 1 ? 'desistiu' : 'desistiram'} aqui ({lostPct}%)
                            {worst && ' · maior queda'}
                          </p>
                        )}
                        <div className="relative overflow-hidden rounded-md border border-brand-gray-200">
                          <div
                            className={`absolute inset-y-0 left-0 ${row.key === 'pago' ? 'bg-emerald-100' : 'bg-brand-gray-100'}`}
                            style={{ width: `${(row.count / top) * 100}%` }}
                          />
                          <div className="relative flex items-center justify-between gap-3 px-3 py-2.5">
                            <span className="text-sm font-medium text-brand-black">{STEP_LABEL[row.key]}</span>
                            <span className="text-base font-bold tabular-nums text-brand-black">{row.count}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-xs text-brand-gray-500">
                  Cada pessoa conta uma vez por etapa no período. “Pagou” vem dos pedidos pagos no Banco de Dados.
                  {data.orders.unpaid > 0 &&
                    ` Além disso, ${data.orders.unpaid} ${data.orders.unpaid === 1 ? 'pedido foi criado' : 'pedidos foram criados'} e ainda não ${data.orders.unpaid === 1 ? 'foi pago' : 'foram pagos'} (ex.: Pix gerado e não pago).`}
                </p>
              </section>

              {/* Abandonados */}
              <section className="mt-12">
                <h2 className="text-sm font-bold uppercase tracking-wide text-brand-gray-500">
                  Quem deixou o e-mail no checkout ({data.abandoned.length})
                </h2>
                {data.abandoned.length === 0 ? (
                  <p className="mt-4 text-sm text-brand-gray-500">Ninguém neste período.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.abandoned.map((cart) => {
                      const bought = !!cart.recoveredAt;
                      return (
                        <li key={cart.email} className="rounded-lg border border-brand-gray-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-brand-black">{cart.name || 'Sem nome'}</p>
                              <p className="truncate text-sm text-brand-gray-500">{cart.email}</p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                bought ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {bought
                                ? 'Comprou'
                                : `Parou em: ${cart.lastStep ? STOPPED_AT[cart.lastStep] : 'sem registro'}`}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-brand-gray-700">{cart.items.join(' · ')}</p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-gray-500">
                            <span>{formatPrice(cart.subtotal, cart.currency === 'USD' ? 'USD' : 'BRL')}</span>
                            <span>Em {formatDate(cart.createdAt)}</span>
                            <span>
                              {cart.unsubscribed
                                ? 'Pediu para não receber e-mail'
                                : cart.emailedAt
                                  ? `Lembrete enviado em ${formatDate(cart.emailedAt)}`
                                  : bought
                                    ? 'Sem lembrete (comprou)'
                                    : 'Lembrete ainda não enviado'}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          ) : null}
        </AdminLayout>
      </Layout>
    </>
  );
}
