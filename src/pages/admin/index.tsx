import { useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/services/products';
import { ALL_STATUSES, orderStatusLabel } from '@/lib/orderStatus';
import { authHeader } from '@/lib/authHeader';

interface AdminOrder {
  id: string;
  order_ref: string;
  status: string;
  total: number;
  currency: string;
  items: { name: string; quantity: number }[];
  address: Record<string, unknown> | null;
  tracking_code: string | null;
  tracking_url: string | null;
  created_at: string;
}

export default function AdminOrdersPage() {
  const { ready } = useRequireAdmin();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_ref, status, total, currency, items, address, tracking_code, tracking_url, created_at')
      .order('created_at', { ascending: false });
    setOrders((data as AdminOrder[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!ready) return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Traz da planilha os pedidos que nunca chegaram ao Banco de Dados — os que
  // foram feitos antes da correção, quando quem gravava era o navegador do
  // cliente. Pedido já existente aqui não é tocado.
  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/import-orders', {
        method: 'POST',
        headers: await authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.imported > 0) {
        toast.success(` pedido(s) recuperado(s)`);
        await loadOrders();
      } else {
        toast.success('Tudo em dia — nenhum pedido faltando.');
      }
    } catch {
      toast.error('Não foi possível importar agora. Tente de novo.');
    } finally {
      setImporting(false);
    }
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-gray-200 bg-brand-gray-50 px-4 py-3">
          <p className="text-sm text-brand-gray-600">
            Faltando algum pedido aqui? Traga do controle interno — o que já está
            na lista não é alterado.
          </p>
          <Button onClick={handleImport} disabled={importing} variant="secondary" className="shrink-0">
            {importing ? 'Importando…' : 'Importar pedidos'}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-brand-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-brand-gray-500">
            Nenhum pedido na lista. Se você já vendeu, use “Importar pedidos” acima.
          </p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <AdminOrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </AdminLayout>
    </Layout>
  );
}

function AdminOrderRow({ order }: { order: AdminOrder }) {
  const [status, setStatus] = useState(order.status);
  const [trackingCode, setTrackingCode] = useState(order.tracking_code ?? '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '');
  const [saving, setSaving] = useState(false);

  const addr = order.address as Record<string, string> | null;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        tracking_code: trackingCode.trim() || null,
        tracking_url: trackingUrl.trim() || null,
      })
      .eq('id', order.id);
    setSaving(false);
    if (error) {
      toast.error('Não foi possível salvar.');
      return;
    }
    toast.success(`Pedido ${order.order_ref} atualizado`);
  };

  return (
    <li className="rounded-lg border border-brand-gray-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-brand-black">{order.order_ref}</p>
          <p className="mt-1 text-xs text-brand-gray-500">
            {new Date(order.created_at).toLocaleString('pt-BR')}
          </p>
          <p className="mt-2 text-sm text-brand-gray-700">
            {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
          {addr && (
            <p className="mt-1 text-xs text-brand-gray-500">
              {addr.street}, {addr.number} — {addr.city}/{addr.state} · {addr.zipCode}
            </p>
          )}
        </div>
        <p className="text-lg font-bold text-brand-black">
          {formatPrice(order.total, order.currency)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 border-t border-brand-gray-100 pt-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Status</label>
          <select className="select-field" value={status} onChange={(e) => setStatus(e.target.value)}>
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

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={handleSave} loading={saving}>
          Salvar alterações
        </Button>
      </div>
    </li>
  );
}
