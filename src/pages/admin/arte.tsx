import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { authHeader } from '@/lib/authHeader';

/**
 * Destino do link da coluna "Arte" na planilha. Confere o login de admin,
 * pede ao servidor um link temporário e baixa o arquivo.
 */
export default function AdminArtworkPage() {
  const { ready } = useRequireAdmin();
  const router = useRouter();
  const [message, setMessage] = useState('Baixando a arte…');

  useEffect(() => {
    if (!ready || !router.isReady) return;
    const path = typeof router.query.path === 'string' ? router.query.path : '';
    const name = typeof router.query.name === 'string' ? router.query.name : '';

    (async () => {
      try {
        const res = await fetch(`/api/admin/artwork?${new URLSearchParams({ path, name })}`, {
          headers: await authHeader(),
        });
        const body = await res.json();
        if (!res.ok || !body.url) throw new Error(body.error || 'Arte não encontrada.');
        window.location.href = body.url;
        setMessage('Download iniciado. Confira a pasta de downloads.');
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Não foi possível baixar a arte.');
      }
    })();
  }, [ready, router.isReady, router.query.path, router.query.name]);

  if (!ready) return null;

  return (
    <>
      <NextSeo title="Arte | Admin" noindex nofollow />
      <Layout showFooter={false}>
        <AdminLayout title="Arte do pedido">
          <p className="text-sm text-brand-gray-500">{message}</p>
        </AdminLayout>
      </Layout>
    </>
  );
}
