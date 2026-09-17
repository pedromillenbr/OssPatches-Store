import { useEffect, useState } from 'react';
import { formatPrice } from '@/services/products';

interface MobileBuyBarProps {
  /** Menor preço do produto (o "a partir de"). */
  price: number;
  /** Id do bloco de personalização que a barra leva o cliente até. */
  targetId: string;
  label?: string;
}

/**
 * Barra fixa no rodapé, só no celular.
 *
 * Na tela pequena a página de produto é uma coluna só: foto, descrição,
 * benefícios e só então o personalizador. Sem essa barra o visitante precisa
 * rolar de volta pra achar o botão de comprar — e boa parte simplesmente sai.
 *
 * Ela some sozinha quando o próprio personalizador está na tela, para não
 * cobrir o botão "Adicionar ao carrinho".
 */
export default function MobileBuyBar({ price, targetId, label = 'Comprar' }: MobileBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '-40% 0px -20% 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  // Informa a altura ocupada para o botão do WhatsApp subir e não se sobrepor.
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--mobile-bar-h',
      visible ? '76px' : '0px'
    );
    return () => {
      document.documentElement.style.setProperty('--mobile-bar-h', '0px');
    };
  }, [visible]);

  const scrollToTarget = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-brand-gray-200 bg-white/95 backdrop-blur-sm transition-transform duration-300 lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] uppercase tracking-wider text-brand-gray-400">
            A partir de
          </p>
          <p className="text-lg font-black leading-tight text-brand-black">
            {formatPrice(price)}
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToTarget}
          tabIndex={visible ? 0 : -1}
          className="ml-auto flex min-h-[48px] flex-1 items-center justify-center bg-brand-black px-6 text-base font-semibold text-white transition-transform active:scale-95"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
