import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import AccountLayout from '@/components/account/AccountLayout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/services/products';
import { orderStatusLabel, orderStatusClass } from '@/lib/orderStatus';

interface OrderRow {
  id: string;
  order_ref: string;
  status: string;
  currency: string;
  total: number;
  items: { name: string; quantity: number; image?: string }[];
  created_at: string;
}

export default function PedidosPage() {
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('id, order_ref, status, currency, total, items, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (!ready) return <FullPageLoader />;

  return (
    <Layout>
      <NextSeo title="Meus pedidos" noindex />
      <AccountLayout title="Meus pedidos">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-brand-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-lg border border-brand-gray-200 p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-brand-gray-500">
                      Pedido {order.order_ref}
                    </p>
                    <p className="mt-1 text-sm text-brand-gray-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusClass(
                      order.status
                    )}`}
                  >
                    {orderStatusLabel(order.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-gray-100 pt-4">
                  <p className="text-sm text-brand-gray-600">
                    {order.items?.length ?? 0}{' '}
                    {order.items?.length === 1 ? 'item' : 'itens'}
                    {order.items?.[0] && ` · ${order.items[0].name}`}
                    {order.items?.length > 1 && ` +${order.items.length - 1}`}
                  </p>
                  <p className="text-lg font-bold text-brand-black">
                    {formatPrice(order.total, order.currency)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AccountLayout>
    </Layout>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-lg border border-dashed border-brand-gray-300 p-10 text-center">
      <p className="text-lg font-semibold text-brand-black">
        Você ainda não fez nenhum pedido
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-brand-gray-500">
        Quando você comprar, seus pedidos aparecem aqui com o status de produção e envio.
      </p>
      <Link href="/" className="mt-6 inline-block">
        <Button size="md">Ver produtos</Button>
      </Link>
    </div>
  );
}

function FullPageLoader() {
  return (
    <Layout>
      <div className="container-site flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gray-300 border-t-brand-black" />
      </div>
    </Layout>
  );
}
