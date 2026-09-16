import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import AccountLayout from '@/components/account/AccountLayout';
import OrderTimeline from '@/components/account/OrderTimeline';
import ReviewForm from '@/components/account/ReviewForm';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/services/products';
import { orderStatusLabel, orderStatusClass } from '@/lib/orderStatus';

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
  image?: string;
  slug?: string;
}

interface OrderRow {
  id: string;
  order_ref: string;
  status: string;
  currency: string;
  total: number;
  items: OrderItem[];
  tracking_code: string | null;
  tracking_url: string | null;
  created_at: string;
}

export default function PedidosPage() {
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [reviewedSlugs, setReviewedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: orderData }, { data: reviewData }] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_ref, status, currency, total, items, tracking_code, tracking_url, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('reviews').select('order_ref, product_slug'),
      ]);
      setOrders((orderData as OrderRow[]) ?? []);
      setReviewedSlugs(
        new Set((reviewData ?? []).map((r) => `${r.order_ref}::${r.product_slug}`))
      );
      setLoading(false);
    })();
  }, [user]);

  if (!ready) return <FullPageLoader />;

  return (
    <Layout>
      <NextSeo title="Meus pedidos" noindex />
      <AccountLayout title="Meus pedidos">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-brand-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <ul className="space-y-5">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                reviewedSlugs={reviewedSlugs}
                onReviewed={(key) => setReviewedSlugs((s) => new Set(s).add(key))}
              />
            ))}
          </ul>
        )}
      </AccountLayout>
    </Layout>
  );
}

function OrderCard({
  order,
  reviewedSlugs,
  onReviewed,
}: {
  order: OrderRow;
  reviewedSlugs: Set<string>;
  onReviewed: (key: string) => void;
}) {
  const [reviewing, setReviewing] = useState<OrderItem | null>(null);
  const isDelivered = order.status === 'delivered';

  return (
    <li className="rounded-lg border border-brand-gray-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-brand-gray-500">Pedido {order.order_ref}</p>
          <p className="mt-1 text-sm text-brand-gray-500">
            {new Date(order.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusClass(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {/* Linha do tempo */}
      <div className="mt-5">
        <OrderTimeline status={order.status} />
      </div>

      {/* Rastreio */}
      {order.tracking_code && (
        <div className="mt-4 rounded-lg bg-brand-gray-50 p-3 text-sm">
          <span className="text-brand-gray-500">Código de rastreio: </span>
          <span className="font-mono font-semibold text-brand-black">{order.tracking_code}</span>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 font-semibold text-brand-black underline underline-offset-2"
            >
              Acompanhar entrega →
            </a>
          )}
        </div>
      )}

      {/* Itens */}
      <div className="mt-4 space-y-2 border-t border-brand-gray-100 pt-4">
        {order.items?.map((item, i) => {
          const key = `${order.order_ref}::${item.slug}`;
          const alreadyReviewed = reviewedSlugs.has(key);
          return (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-brand-gray-700">
                {item.quantity}× {item.name}
              </span>
              {isDelivered && item.slug && (
                alreadyReviewed ? (
                  <span className="text-xs text-emerald-600">✓ Avaliado</span>
                ) : (
                  <button
                    onClick={() => setReviewing(item)}
                    className="shrink-0 text-xs font-semibold text-brand-black underline underline-offset-2"
                  >
                    Avaliar
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 flex justify-end">
        <p className="text-lg font-bold text-brand-black">
          {formatPrice(order.total, order.currency)}
        </p>
      </div>

      {/* Formulário de avaliação */}
      {reviewing && reviewing.slug && (
        <ReviewForm
          orderRef={order.order_ref}
          productSlug={reviewing.slug}
          productName={reviewing.name}
          onDone={() => {
            onReviewed(`${order.order_ref}::${reviewing.slug}`);
            setReviewing(null);
          }}
        />
      )}
    </li>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-lg border border-dashed border-brand-gray-300 p-10 text-center">
      <p className="text-lg font-semibold text-brand-black">Você ainda não fez nenhum pedido</p>
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
