import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { COMPANY } from '@/config/company';

type State = 'loading' | 'done' | 'invalid';

/**
 * Cancelamento dos lembretes de carrinho, pelo link do rodapé do e-mail.
 *
 * Um clique resolve: quem pediu para sair não deve ter que preencher formulário
 * nem responder e-mail. A baixa é feita na abertura da página.
 */
export default function DescadastrarPage() {
  const router = useRouter();
  const [state, setState] = useState<State>('loading');
  const sent = useRef(false);

  useEffect(() => {
    if (!router.isReady || sent.current) return;

    const token = typeof router.query.t === 'string' ? router.query.t : '';
    if (!token) {
      setState('invalid');
      return;
    }
    sent.current = true;

    (async () => {
      try {
        const response = await fetch('/api/cart/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        setState(response.ok ? 'done' : 'invalid');
      } catch {
        setState('invalid');
      }
    })();
  }, [router]);

  return (
    <Layout>
      <NextSeo title="Cancelar lembretes" noindex nofollow />

      <div className="container-site max-w-md py-24 text-center">
        {state === 'loading' && (
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-gray-200 border-t-brand-black" />
        )}

        {state === 'done' && (
          <>
            <h1 className="text-2xl font-extrabold text-brand-black">Pronto</h1>
            <p className="mt-3 leading-relaxed text-brand-gray-600">
              Você não vai mais receber lembretes de carrinho. E-mails sobre pedidos
              que você fizer continuam chegando normalmente — eles fazem parte da
              compra.
            </p>
            <Link href="/" className="mt-8 inline-block">
              <Button size="lg" variant="secondary">
                Voltar para a loja
              </Button>
            </Link>
          </>
        )}

        {state === 'invalid' && (
          <>
            <h1 className="text-2xl font-extrabold text-brand-black">
              Não conseguimos processar esse link
            </h1>
            <p className="mt-3 leading-relaxed text-brand-gray-600">
              Escreva para{' '}
              <a
                href={`mailto:${COMPANY.email}`}
                className="font-semibold text-brand-black underline underline-offset-2"
              >
                {COMPANY.email}
              </a>{' '}
              que tiramos você da lista na mão.
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
