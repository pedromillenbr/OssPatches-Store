import { useEffect, useMemo, useState } from 'react';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { supabase } from '@/lib/supabase';
import { authHeader } from '@/lib/authHeader';
import { formatPrice } from '@/services/products';
import { ALL_STATUSES, orderStatusLabel } from '@/lib/orderStatus';

interface AdminOrderItem {
  name: string;
  quantity: number;
  price?: number;
  /** Personalização dos pedidos novos, como veio do checkout. */
  customization?: Record<string, unknown> | null;
  /** Personalização já montada em texto, nos pedidos vindos da planilha. */
  details?: string;
}

interface AdminOrder {
  id: string;
  order_ref: string;
  status: string;
  subtotal: number | null;
  shipping_cost: number | null;
  discount_amount: number | null;
  total: number;
  currency: string;
  items: AdminOrderItem[];
  address: Record<string, string> | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_cpf?: string | null;
  payment_method: string | null;
  shipping_method: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  seen_at: string | null;
  created_at: string;
}

const SELECT_COLUMNS =
  'id, order_ref, status, subtotal, shipping_cost, discount_amount, total, currency, items, ' +
  'address, customer_name, customer_email, customer_phone, payment_method, shipping_method, ' +
  'tracking_code, tracking_url, seen_at, created_at';

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'Pix',
  card: 'Cartão',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  paypal: 'PayPal',
};

export default function AdminOrdersPage() {
  const { ready } = useRequireAdmin();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'import' | 'payments' | null>(null);
  const [migrationPending, setMigrationPending] = useState(false);

  const loadOrders = async () => {
    // O CPF vem numa coluna mais nova (supabase/orders_cpf.sql). Se ela ainda
    // não existe, a lista carrega igual, só sem o CPF.
    const fetchOrders = (columns: string) =>
      supabase.from('orders').select(columns).order('created_at', { ascending: false });

    let { data, error } = await fetchOrders(`${SELECT_COLUMNS}, customer_cpf`);
    if (error) ({ data, error } = await fetchOrders(SELECT_COLUMNS));

    if (error) {
      // As colunas novas (cliente, envio, "já vi") só existem depois de rodar
      // supabase/orders_painel_completo.sql. Até lá, mostramos a lista básica
      // em vez de uma tela vazia que parece perda de pedido.
      console.warn('[admin] colunas novas ainda não existem:', error.message);
      setMigrationPending(true);
      const { data: basic } = await supabase
        .from('orders')
        .select('id, order_ref, status, total, currency, items, address, tracking_code, tracking_url, created_at')
        .order('created_at', { ascending: false });
      setOrders((basic as unknown as AdminOrder[]) ?? []);
      setLoading(false);
      return;
    }

    setMigrationPending(false);
    setOrders((data as unknown as AdminOrder[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!ready) return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const novos = useMemo(() => orders.filter((o) => !o.seen_at).length, [orders]);

  /** Chama uma rota do painel e recarrega a lista quando ela mudou algo. */
  const runAction = async (
    key: 'import' | 'payments',
    url: string,
    describe: (data: Record<string, number>) => string
  ) => {
    setBusy(key);
    try {
      const res = await fetch(url, { method: 'POST', headers: await authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(describe(data));
      await loadOrders();
    } catch {
      toast.error('Não deu certo agora. Tente de novo em instantes.');
    } finally {
      setBusy(null);
    }
  };

  // Marca como visto assim que a loja abre o pedido. É isso que tira a
  // marcação vermelha de "novo".
  const markSeen = async (order: AdminOrder) => {
    if (order.seen_at) return;
    const seenAt = new Date().toISOString();
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, seen_at: seenAt } : o)));
    await supabase.from('orders').update({ seen_at: seenAt }).eq('id', order.id);
  };

  if (!ready) {
    return (
      <Layout>
        <div className="container-site flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gray-300 border-t-brand-black" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <NextSeo title="Admin — Pedidos" noindex />
      <AdminLayout title="Pedidos">
        {migrationPending && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Falta um passo no Banco de Dados: rode{' '}
            <code className="font-mono">supabase/orders_painel_completo.sql</code> no SQL
            Editor para ver cliente, entrega e a marcação de pedidos novos.
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-gray-200 bg-brand-gray-50 px-4 py-3">
          <p className="text-sm text-brand-gray-600">
            {novos > 0 ? (
              <>
                <strong className="text-red-600">
                  {novos} pedido{novos > 1 ? 's' : ''} que você ainda não abriu
                </strong>{' '}
                — marcados em vermelho.
              </>
            ) : (
              'Todos os pedidos já foram vistos.'
            )}
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() =>
                runAction('payments', '/api/admin/check-payments', (d) =>
                  d.confirmed > 0
                    ? `${d.confirmed} pagamento(s) confirmado(s)`
                    : 'Nenhum pagamento novo encontrado.'
                )
              }
            >
              {busy === 'payments' ? 'Verificando…' : 'Verificar pagamentos'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() =>
                runAction('import', '/api/admin/import-orders', (d) =>
                  d.imported > 0
                    ? `${d.imported} pedido(s) recuperado(s)`
                    : 'Tudo em dia — nenhum pedido faltando.'
                )
              }
            >
              {busy === 'import' ? 'Importando…' : 'Importar pedidos'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-brand-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-brand-gray-500">
            Nenhum pedido na lista. Se você já vendeu, use “Importar pedidos” acima.
          </p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <AdminOrderRow
                key={order.id}
                order={order}
                onOpen={() => markSeen(order)}
                onSaved={loadOrders}
              />
            ))}
          </ul>
        )}
      </AdminLayout>
    </Layout>
  );
}

/** Personalização do item, em uma linha, para quem vai produzir. */
function itemDetails(item: AdminOrderItem): string {
  if (item.details) return item.details;

  const c = item.customization;
  if (!c) return '';

  const str = (key: string) => {
    const value = c[key];
    return value === undefined || value === null || value === '' ? '' : String(value);
  };

  const stripe = str('stripe');

  return [
    str('size') && `Tamanho ${str('size')}`,
    str('degree') && `${str('degree')} grau(s)`,
    str('format'),
    c.type === 'custom' ? 'Personalizada' : '',
    str('embroideredName') && `Nome: ${str('embroideredName')}`,
    str('nameColor') && `Bordado ${str('nameColor')}`,
    stripe && stripe !== 'none' ? `Ponteira ${stripe}` : '',
    str('artworkFileName') && `Arte: ${str('artworkFileName')}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Endereço em texto, pulando o que não existe.
 *
 * Pedido recuperado do controle interno só tem CEP, número e complemento — a
 * rua e a cidade vêm do CEP. Melhor mostrar o que há do que inventar linha.
 */
function formatAddress(addr: Record<string, string>): string {
  const rua = [addr.street, addr.number].filter(Boolean).join(', ');
  const linha1 = [rua, addr.complement].filter(Boolean).join(' — ');
  const cidade = [addr.city, addr.state].filter(Boolean).join('/');
  const linha2 = [addr.neighborhood, cidade].filter(Boolean).join(', ');
  const cep = addr.zipCode || addr.cep;

  return [linha1, linha2, cep && `CEP ${cep}`].filter(Boolean).join('\n');
}

/** Link direto de WhatsApp a partir do telefone gravado no pedido. */
function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}

function AdminOrderRow({
  order,
  onOpen,
  onSaved,
}: {
  order: AdminOrder;
  onOpen: () => void;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [trackingCode, setTrackingCode] = useState(order.tracking_code ?? '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '');
  const [saving, setSaving] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  const novo = !order.seen_at;
  const addr = order.address;

  // O link da planilha é montado na hora: a linha do pedido muda de lugar
  // conforme a planilha cresce, então guardar não adiantaria.
  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    onOpen();
    setOpen(true);

    if (sheetUrl) return;
    try {
      const res = await fetch(`/api/admin/sheet-link?orderRef=${order.order_ref}`, {
        headers: await authHeader(),
      });
      const data = await res.json();
      if (data.url) setSheetUrl(data.url);
    } catch {
      /* sem link é só um atalho a menos */
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          orderRef: order.order_ref,
          status,
          trackingCode: trackingCode.trim(),
          trackingUrl: trackingUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // A planilha é o controle interno: se ela não recebeu, a loja precisa
      // saber, senão vai confiar num dado que só existe aqui.
      toast.success(
        data.sheetRows > 0
          ? `Pedido ${order.order_ref} atualizado aqui e na planilha`
          : `Pedido ${order.order_ref} atualizado (a planilha não respondeu)`
      );
      await onSaved();
    } catch {
      toast.error('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li
      className={clsx(
        'overflow-hidden rounded-lg border border-l-4 border-brand-gray-200 bg-white',
        novo ? 'border-l-red-500' : 'border-l-emerald-500'
      )}
    >
      {/* Cabeçalho sempre visível — clique abre e fecha */}
      <button
        type="button"
        onClick={toggle}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-brand-gray-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-brand-black">
              {order.order_ref}
            </span>
            {novo && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                Novo
              </span>
            )}
            <span className="rounded-full bg-brand-gray-100 px-2 py-0.5 text-[11px] font-semibold text-brand-gray-700">
              {orderStatusLabel(order.status)}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-brand-gray-700">
            {order.customer_name || 'Cliente sem nome'} ·{' '}
            {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
          <p className="mt-0.5 text-xs text-brand-gray-500">
            {new Date(order.created_at).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-brand-black">
            {formatPrice(order.total, order.currency)}
          </span>
          <span
            className={clsx('text-brand-gray-400 transition-transform', open && 'rotate-180')}
            aria-hidden
          >
            ▾
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-brand-gray-100 px-5 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Cliente">
              <p className="font-medium text-brand-black">{order.customer_name || '—'}</p>
              {order.customer_cpf && <p>CPF {order.customer_cpf}</p>}
              {order.customer_email && (
                <a href={`mailto:${order.customer_email}`} className="block underline">
                  {order.customer_email}
                </a>
              )}
              {order.customer_phone && (
                <a
                  href={whatsappLink(order.customer_phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="block underline"
                >
                  {order.customer_phone} (WhatsApp)
                </a>
              )}
            </Field>

            <Field label="Entrega">
              <p>{order.shipping_method || 'Forma de envio não registrada'}</p>
              {addr ? (
                <p className="mt-1 whitespace-pre-line">{formatAddress(addr)}</p>
              ) : (
                <p className="mt-1 text-brand-gray-500">Endereço não registrado</p>
              )}
            </Field>

            <Field label="Pagamento">
              <p>
                {order.payment_method
                  ? PAYMENT_LABEL[order.payment_method] || order.payment_method
                  : '—'}
              </p>
              <dl className="mt-2 space-y-0.5">
                <Money label="Produtos" value={order.subtotal} currency={order.currency} />
                <Money label="Frete" value={order.shipping_cost} currency={order.currency} />
                {!!order.discount_amount && (
                  <Money
                    label="Desconto"
                    value={-order.discount_amount}
                    currency={order.currency}
                  />
                )}
                <div className="flex justify-between gap-4 border-t border-brand-gray-100 pt-1 font-semibold text-brand-black">
                  <dt>Total pago</dt>
                  <dd>{formatPrice(order.total, order.currency)}</dd>
                </div>
              </dl>
            </Field>

            <Field label="Itens">
              <ul className="space-y-2">
                {order.items?.map((item, index) => (
                  <li key={index}>
                    <p className="font-medium text-brand-black">
                      {item.quantity}× {item.name}
                    </p>
                    {itemDetails(item) && (
                      <p className="text-xs text-brand-gray-500">{itemDetails(item)}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Field>
          </div>

          <div className="mt-6 grid gap-3 border-t border-brand-gray-100 pt-5 sm:grid-cols-2">
            <div>
              <label className="label-field">Status</label>
              <select
                className="select-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Código de rastreio</label>
              <input
                className="input-field"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="BR123456789"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Link de rastreio (opcional)</label>
              <input
                className="input-field"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://rastreamento.correios.com.br/..."
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-brand-gray-500">
              Salvar atualiza o painel e a planilha ao mesmo tempo.
              {sheetUrl && (
                <>
                  {' · '}
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Abrir na planilha
                  </a>
                </>
              )}
            </p>
            <Button size="sm" onClick={handleSave} loading={saving}>
              Salvar alterações
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function Money({
  label,
  value,
  currency,
}: {
  label: string;
  value: number | null;
  currency: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd>{value === null ? '—' : formatPrice(value, currency)}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-sm text-brand-gray-700">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand-gray-400">
        {label}
      </p>
      {children}
    </div>
  );
}
