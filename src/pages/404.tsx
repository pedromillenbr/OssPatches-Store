import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="container-site py-24 text-center">
        <p className="text-8xl font-black text-brand-gray-100 mb-4">404</p>
        <h1 className="text-2xl font-bold text-brand-black mb-3">
          Página não encontrada
        </h1>
        <p className="text-brand-gray-500 mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <Link href="/">
          <Button size="lg">Voltar à loja</Button>
        </Link>
      </div>
    </Layout>
  );
}
