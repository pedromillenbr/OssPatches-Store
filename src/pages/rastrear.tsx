import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OrderTimeline from '@/components/account/OrderTimeline';
import { orderStatusLabel, orderStatusClass } from '@/lib/orderStatus';
import { COMPANY } from '@/config/company';

interface TrackResult {
  found: boolean;
  status?: string;
  shippingStage?: string;
  trackingCode?: string;
  trackingUrl?: string;
  createdAt?: string;
}

/**
 * Deixa o número do pedido no formato OSS-AAMMDD-XXXXXXXX enquanto a pessoa
 * digita. Sem isso, quem cola o número do e-mail com espaço sobrando ou em
 * minúsculas levava um "formato inválido" sem entender o motivo.
 */
function maskOrderRef(raw: string): string {
  const clean = raw
    .toUpperCase()
    .replace(/^OSS-?/, '')
    .replace(/[^0-9A-F]/g, '')
    .slice(0, 14);
  const date = clean.slice(0, 6);
  const code = clean.slice(6);
  return ['OSS', date, code].filter(Boolean).join('-');
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function RastrearPage() {
  const [orderRef, setOrderRef] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderRef, email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Não foi possível consultar agora. Tente em instantes.');
        return;
      }
      setResult(data as TrackResult);
    } catch {
      setError('Sem conexão com o servidor. Verifique sua internet e tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  const purchasedAt = formatDate(result?.createdAt);

  return (
    <Layout>
      <NextSeo
        title="Rastrear pedido"
        description="Acompanhe seu pedido OssPatches com o número do pedido e o e-mail da compra, sem precisar de conta."
      />

      <div className="container-site max-w-xl py-14 md:py-20">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-black">
            Rastrear pedido
          </h1>
          <p className="mt-3 leading-relaxed text-brand-gray-600">
            Informe o número do pedido e o e-mail usado na compra. Não precisa ter
            conta.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <Input
            label="Número do pedido"
            value={orderRef}
            onChange={(e) => setOrderRef(maskOrderRef(e.target.value))}
            placeholder="OSS-260926-A1B2C3D4"
            hint="Está no e-mail de confirmação da compra."
            autoComplete="off"
            spellCheck={false}
            required
          />

          <Input
            label="E-mail da compra"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
            required
          />

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Consultando…' : 'Acompanhar pedido'}
          </Button>
        </form>

        {error && (
          <p className="mt-6 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {result && !result.found && (
          <div className="mt-8 border border-brand-gray-200 bg-brand-gray-50 px-6 py-6 text-center">
            <p className="font-semibold text-brand-black">
              Não encontramos esse pedido
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-gray-600">
              Confira se o número e o e-mail são exatamente os do e-mail de
              confirmação — o e-mail precisa ser o mesmo usado na compra. Se
              estiver certo e ainda assim não aparecer, fale com a gente por{' '}
              <a
                href={`mailto:${COMPANY.email}`}
                className="font-semibold text-brand-black underline underline-offset-2"
              >
                {COMPANY.email}
              </a>
              .
            </p>
          </div>
        )}

        {result?.found && (
          <div className="mt-8 animate-fade-in border border-brand-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-gray-200 px-6 py-4">
              <div>
                <p className="font-mono text-sm text-brand-gray-500">{orderRef}</p>
                {purchasedAt && (
                  <p className="mt-0.5 text-xs text-brand-gray-500">
                    Compra em {purchasedAt}
                  </p>
                )}
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold ${orderStatusClass(
                  result.status ?? 'pending'
                )}`}
              >
                {orderStatusLabel(result.status ?? 'pending')}
              </span>
            </div>

            <div className="px-6 py-6">
              <OrderTimeline status={result.status ?? 'pending'} />

              {result.shippingStage && (
                <p className="mt-6 text-sm text-brand-gray-600">
                  Situação do envio:{' '}
                  <strong className="text-brand-black">{result.shippingStage}</strong>
                </p>
              )}

              {result.trackingCode && (
                <div className="mt-4 bg-brand-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-brand-gray-500">
                    Código de rastreio
                  </p>
                  <p className="mt-1 font-mono font-bold text-brand-black">
                    {result.trackingCode}
                  </p>
                </div>
              )}

              {result.trackingUrl && (
                <a
                  href={result.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-black underline underline-offset-4 hover:text-brand-gray-600"
                >
                  Acompanhar na transportadora →
                </a>
              )}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-sm text-brand-gray-500">
          Tem conta na loja?{' '}
          <Link
            href="/minha-conta"
            className="font-semibold text-brand-black underline underline-offset-2"
          >
            Veja todos os seus pedidos
          </Link>
          .
        </p>
      </div>
    </Layout>
  );
}
