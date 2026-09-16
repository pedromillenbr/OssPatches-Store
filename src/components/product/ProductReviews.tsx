import { useEffect, useState } from 'react';
import StarRating from '@/components/ui/StarRating';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  author_name: string | null;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
}

/**
 * Avaliações aprovadas de um produto (compra verificada), exibidas na página
 * do produto. Só aparecem as que o dono aprovou (RLS: status = 'approved').
 */
export default function ProductReviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('id, author_name, rating, comment, photos, created_at')
      .eq('product_slug', slug)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data as Review[]) ?? []);
        setLoaded(true);
      });
  }, [slug]);

  // Enquanto carrega ou se não há avaliações, não ocupa espaço.
  if (!loaded || reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section className="border-t border-brand-gray-200 py-12">
      <div className="container-site max-w-4xl">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-black">
            Avaliações de quem comprou
          </h2>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <StarRating rating={Math.round(avg)} size={20} />
          <span className="text-sm text-brand-gray-600">
            {avg.toFixed(1)} · {reviews.length} avaliaç{reviews.length === 1 ? 'ão' : 'ões'}
          </span>
        </div>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-brand-gray-200 p-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-black">{r.author_name || 'Cliente'}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Compra verificada
                </span>
              </div>
              <div className="mt-1">
                <StarRating rating={r.rating} />
              </div>
              {r.comment && <p className="mt-3 text-sm text-brand-gray-700">“{r.comment}”</p>}
              {r.photos?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.photos.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt="Foto da avaliação"
                      className="h-20 w-20 rounded border border-brand-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
