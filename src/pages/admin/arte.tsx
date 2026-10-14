import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { authHeader } from '@/lib/authHeader';

/**
 * Destino do link da coluna "Arte" na planilha. Confere o login de admin,
 * pede ao servidor um link temporário e redireciona para o arquivo.
 */
export default function AdminArtworkPage() {
  const { ready } = useRequireAdmin();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || !router.isReady) return;
    const path = typeof router.query.path === 'string' ? router.query.path : '';

    (async () => {
      try {
        const res = await fetch(`/api/admin/artwork?path=${encodeURIComponent(path)}`, {
          headers: await authHeader(),
        });
        const body = await res.json();
        if (!res.ok || !body.url) throw new Error(body.error || 'Arte não encontrada.');
        window.location.replace(body.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível abrir a arte.');
      }
    })();
  }, [ready, router.isReady, router.query.path]);

  if (!ready) return null;

  return (
    <>
      <NextSeo title="Arte | Admin" noindex nofollow />
      <Layout showFooter={false}>
        <AdminLayout title="Arte do pedido">
          <p className="text-sm text-brand-gray-500">{error || 'Abrindo a arte…'}</p>
        </AdminLayout>
      </Layout>
    </>
  );
}
