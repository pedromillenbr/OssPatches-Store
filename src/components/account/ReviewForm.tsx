import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface ReviewFormProps {
  orderRef: string;
  productSlug: string;
  productName: string;
  onDone: () => void;
}

/**
 * Formulário de avaliação de um item do pedido: nota (estrelas), texto e
 * fotos. A avaliação nasce "pendente" e só aparece no site após o dono
 * aprovar (moderação).
 */
export default function ReviewForm({ orderRef, productSlug, productName, onDone }: ReviewFormProps) {
  const { user, profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...imgs].slice(0, 4)); // até 4 fotos
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rating < 1) {
      toast.error('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }
    setSubmitting(true);
    try {
      // 1) sobe as fotos (se houver) para o storage, na pasta do usuário
      const photoUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${orderRef}-${productSlug}-${i}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('reviews')
          .upload(path, file, { upsert: true, cacheControl: '3600' });
        if (!upErr) {
          const { data } = supabase.storage.from('reviews').getPublicUrl(path);
          photoUrls.push(data.publicUrl);
        }
      }

      // 2) grava a avaliação (status pending — aguarda moderação)
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        order_ref: orderRef,
        product_slug: productSlug,
        product_name: productName,
        author_name: profile?.full_name || 'Cliente',
        rating,
        comment: comment.trim() || null,
        photos: photoUrls,
      });
      if (error) throw error;

      toast.success('Avaliação enviada! Ela aparece no site após aprovação.');
      onDone();
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível enviar a avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-brand-gray-200 bg-brand-gray-50 p-4">
      <p className="text-sm font-semibold text-brand-black">Avaliar: {productName}</p>

      {/* Estrelas */}
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            className="transition-transform hover:scale-110"
          >
            <svg width={28} height={28} viewBox="0 0 20 20" fill={n <= (hover || rating) ? '#FACC15' : '#E5E7EB'}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      {/* Texto */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder="Conte como foi sua experiência com o produto (opcional)."
        className="input-field mt-3 resize-none"
      />

      {/* Fotos */}
      <div className="mt-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm font-semibold text-brand-black underline underline-offset-2"
        >
          Adicionar fotos {files.length > 0 && `(${files.length}/4)`}
        </button>
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded border border-brand-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-brand-black text-xs text-white"
                  aria-label="Remover foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <Button type="submit" size="sm" loading={submitting}>
          Enviar avaliação
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
