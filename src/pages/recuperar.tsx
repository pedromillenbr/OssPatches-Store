import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';
import type { CartItem } from '@/types';

type State = 'loading' | 'done' | 'invalid';

/**
 * Destino do botão "Voltar para o meu carrinho" do e-mail de lembrete.
 *
 * Remonta o carrinho a partir do que ficou salvo no servidor, porque o
 * carrinho normal vive só no navegador onde foi montado — sem isto, abrir o
 * e-mail no celular levaria a uma loja vazia.
 */
export default function RecuperarPage() {
  const router = useRouter();
  const [state, setState] = useState<State>('loading');
  const applied = useRef(false);

  useEffect(() => {
    // O router só traz a query depois da hidratação.
    if (!router.isReady || applied.current) return;

    const token = typeof router.query.t === 'string' ? router.query.t : '';
    if (!token) {
      setState('invalid');
      return;
    }
    applied.current = true;

    (async () => {
      try {
        const response = await fetch(`/api/cart/restore?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          setState('invalid');
          return;
        }

        const data = (await response.json()) as { items: CartItem[] };
        if (!Array.isArray(data.items) || data.items.length === 0) {
          setState('invalid');
          return;
        }

        // Substitui o carrinho em vez de somar: se a pessoa ainda tem os
        // mesmos itens neste navegador, somar duplicaria tudo.
        useCartStore.setState({ items: data.items });
        setState('done');
        router.replace('/carrinho');
      } catch {
        setState('invalid');
      }
    })();
  }, [router]);

  return (
    <Layout>
      <NextSeo title="Recuperando seu carrinho" noindex nofollow />

      <div className="container-site max-w-md py-24 text-center">
        {state !== 'invalid' ? (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-gray-200 border-t-brand-black" />
            <p className="mt-6 text-brand-gray-600">Trazendo suas peças de volta…</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-brand-black">
              Esse link não vale mais
            </h1>
            <p className="mt-3 leading-relaxed text-brand-gray-600">
              Pode ser que você já tenha finalizado a compra ou que o carrinho tenha
              sido atualizado. Seus produtos continuam à sua espera na loja.
            </p>
            <Link href="/" className="mt-8 inline-block">
              <Button size="lg">Ver produtos</Button>
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}
