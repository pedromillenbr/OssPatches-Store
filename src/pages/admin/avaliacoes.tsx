import { useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { supabase } from '@/lib/supabase';

interface AdminReview {
  id: string;
  product_name: string | null;
  product_slug: string;
  author_name: string | null;
  rating: number;
  comment: string | null;
  photos: string[];
  status: string;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export default function AdminReviewsPage() {
  const { ready } = useRequireAdmin();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    supabase
      .from('reviews')
      .select('id, product_name, product_slug, author_name, rating, comment, photos, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data as AdminReview[]) ?? []);
        setLoading(false);
      });
  }, [ready]);

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    const prev = reviews;
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
    if (error) {
      setReviews(prev);
      toast.error('Não foi possível atualizar.');
    } else {
      toast.success(status === 'approved' ? 'Avaliação aprovada' : 'Avaliação rejeitada');
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
      <NextSeo title="Admin — Avaliações" noindex />
      <AdminLayout title="Avaliações">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-brand-gray-100" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-brand-gray-500">Nenhuma avaliação ainda.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-brand-gray-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={r.rating} />
                      <span className="text-sm font-semibold text-brand-black">
                        {r.author_name || 'Cliente'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-brand-gray-500">
                      {r.product_name || r.product_slug} ·{' '}
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      r.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : r.status === 'rejected'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>

                {r.comment && <p className="mt-3 text-sm text-brand-gray-700">“{r.comment}”</p>}

                {r.photos?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.photos.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded border border-brand-gray-200 object-cover"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  {r.status !== 'approved' && (
                    <Button size="sm" onClick={() => moderate(r.id, 'approved')}>
                      Aprovar
                    </Button>
                  )}
                  {r.status !== 'rejected' && (
                    <Button size="sm" variant="secondary" onClick={() => moderate(r.id, 'rejected')}>
                      Rejeitar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminLayout>
    </Layout>
  );
}
