import { useCallback, useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { supabase } from '@/lib/supabase';

interface AdminCoupon {
  code: string;
  percent: number;
  maxUsesPerCustomer: number;
  active: boolean;
}

/** Envia o token da sessão para a API conferir que é mesmo o dono da loja. */
async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminCouponsPage() {
  const { ready } = useRequireAdmin();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/coupons', { headers: await authHeaders() });
    if (!res.ok) {
      toast.error('Não foi possível carregar os cupons');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const toggle = async (coupon: AdminCoupon) => {
    const next = !coupon.active;
    setSaving(coupon.code);

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ code: coupon.code, active: next }),
    });

    setSaving(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Não foi possível salvar');
      return;
    }

    setCoupons((prev) =>
      prev.map((c) => (c.code === coupon.code ? { ...c, active: next } : c))
    );
    toast.success(next ? `${coupon.code} ligado` : `${coupon.code} desligado`);
  };

  if (!ready) return null;

  return (
    <>
      <NextSeo title="Cupons | Admin" noindex nofollow />
      <Layout showFooter={false}>
        <AdminLayout title="Cupons">
          {loading ? (
            <p className="text-sm text-brand-gray-500">Carregando…</p>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="flex flex-col gap-4 rounded-2xl border border-brand-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black tracking-tight text-brand-black">
                        {coupon.code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          coupon.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-brand-gray-100 text-brand-gray-500'
                        }`}
                      >
                        {coupon.active ? 'Ligado' : 'Desligado'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-brand-gray-600">
                      {coupon.percent}% de desconto nos produtos (não vale para o frete).
                    </p>
                    <p className="text-sm text-brand-gray-600">
                      {coupon.maxUsesPerCustomer > 0
                        ? `Cada cliente pode usar em até ${coupon.maxUsesPerCustomer} compras pagas.`
                        : 'Sem limite de uso por cliente.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(coupon)}
                    disabled={saving === coupon.code}
                    className={`min-h-[48px] shrink-0 rounded-xl px-6 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      coupon.active
                        ? 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
                        : 'bg-brand-black text-white hover:bg-brand-gray-800'
                    }`}
                  >
                    {saving === coupon.code
                      ? 'Salvando…'
                      : coupon.active
                        ? 'Desligar cupom'
                        : 'Ligar cupom'}
                  </button>
                </div>
              ))}

              <p className="pt-2 text-xs leading-relaxed text-brand-gray-500">
                Desligar um cupom vale na hora, sem precisar publicar o site de novo. Quem já
                tinha o cupom aplicado no carrinho também deixa de receber o desconto, porque o
                valor é sempre recalculado no servidor na hora de fechar a compra.
              </p>
            </div>
          )}
        </AdminLayout>
      </Layout>
    </>
  );
}
