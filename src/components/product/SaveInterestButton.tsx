import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface SaveInterestButtonProps {
  slug: string;
  name: string;
  image?: string;
  price?: number;
}

/**
 * Botão "Salvar interesse" nas páginas de produto.
 * Guarda a peça na aba Interesses da conta (ex: faixa roxa que você quer
 * comprar depois). Se não estiver logado, leva para /entrar.
 */
export default function SaveInterestButton({ slug, name, image, price }: SaveInterestButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Já está nos interesses?
  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    supabase
      .from('interests')
      .select('id')
      .eq('product_slug', slug)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, slug]);

  const handleClick = async () => {
    if (authLoading) return;
    if (!user) {
      toast('Entre para salvar seus interesses');
      router.push(`/entrar?redirect=/produtos/${slug}`);
      return;
    }

    setBusy(true);
    if (saved) {
      const { error } = await supabase
        .from('interests')
        .delete()
        .eq('user_id', user.id)
        .eq('product_slug', slug);
      setBusy(false);
      if (error) return toast.error('Não foi possível remover.');
      setSaved(false);
      toast.success('Removido dos interesses');
    } else {
      const { error } = await supabase.from('interests').insert({
        user_id: user.id,
        product_slug: slug,
        product_name: name,
        product_image: image ?? null,
        price: price ?? null,
      });
      setBusy(false);
      if (error) return toast.error('Não foi possível salvar.');
      setSaved(true);
      toast.success('Salvo nos seus interesses');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
        saved ? 'text-amber-600' : 'text-brand-gray-600 hover:text-brand-black'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {saved ? 'Salvo nos interesses' : 'Salvar interesse'}
    </button>
  );
}
