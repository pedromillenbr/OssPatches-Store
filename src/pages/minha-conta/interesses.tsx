import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AccountLayout from '@/components/account/AccountLayout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/services/products';

interface InterestRow {
  id: string;
  product_slug: string;
  product_name: string;
  product_image: string | null;
  price: number | null;
  note: string | null;
  created_at: string;
}

export default function InteressesPage() {
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const [items, setItems] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('interests')
      .select('id, product_slug, product_name, product_image, price, note, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as InterestRow[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const handleRemove = async (id: string) => {
    const prev = items;
    setItems((s) => s.filter((i) => i.id !== id)); // otimista
    const { error } = await supabase.from('interests').delete().eq('id', id);
    if (error) {
      setItems(prev);
      toast.error('Não foi possível remover. Tente de novo.');
    } else {
      toast.success('Removido dos interesses');
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
      <NextSeo title="Meus interesses" noindex />
      <AccountLayout title="Meus interesses">
        <p className="-mt-3 mb-6 text-sm text-brand-gray-500">
          As peças que você marcou para comprar depois ficam guardadas aqui.
        </p>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-brand-gray-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-gray-300 p-10 text-center">
            <p className="text-lg font-semibold text-brand-black">
              Nenhum interesse salvo ainda
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-brand-gray-500">
              Ao ver um produto, toque em “Salvar interesse” para guardá-lo aqui e
              decidir depois.
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button size="md">Explorar produtos</Button>
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex gap-4 rounded-lg border border-brand-gray-200 p-4"
              >
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded bg-brand-gray-50">
                  {item.product_image && (
                    <Image
                      src={item.product_image}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/produtos/${item.product_slug}`}
                    className="font-semibold text-brand-black hover:underline"
                  >
                    {item.product_name}
                  </Link>
                  {item.price != null && (
                    <p className="mt-1 text-sm text-brand-gray-600">
                      {formatPrice(item.price)}
                    </p>
                  )}
                  {item.note && (
                    <p className="mt-1 text-xs italic text-brand-gray-500">“{item.note}”</p>
                  )}
                  <div className="mt-3 flex items-center gap-4">
                    <Link
                      href={`/produtos/${item.product_slug}`}
                      className="text-sm font-semibold text-brand-black hover:underline"
                    >
                      Comprar
                    </Link>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-sm text-brand-gray-400 hover:text-red-500"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AccountLayout>
    </Layout>
  );
}
