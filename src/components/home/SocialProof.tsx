'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import reviews from '@/data/reviews.json';
import Image from 'next/image';
import StarRating from '@/components/ui/StarRating';

interface Review {
  id: number;
  name: string;
  title: string;
  rating: number;
  text: string;
  date: string;
  photo?: string;
  // Ponto do rosto na foto (em %) e quanto aproximar dentro da bolinha
  photoFocus?: { x: number; y: number; zoom: number };
  hidden?: boolean;
}

const AVATAR_PX = 44;

function ReviewAvatar({ src, name, focus }: { src: string; name: string; focus?: Review['photoFocus'] }) {
  const { x, y, zoom } = focus ?? { x: 50, y: 50, zoom: 1 };
  return (
    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm bg-brand-gray-100">
      <Image
        src={encodeURI(src)}
        alt={`Foto de ${name}`}
        fill
        sizes={`${Math.round(AVATAR_PX * zoom)}px`}
        draggable={false}
        className="object-cover"
        style={{
          objectPosition: `${x}% ${y}%`,
          transformOrigin: `${x}% ${y}%`,
          // leva o rosto para o centro da bolinha e aproxima
          transform: `translate(${50 - x}%, ${50 - y}%) scale(${zoom})`,
        }}
      />
    </div>
  );
}

// Reviews marcadas "hidden" (ou sem texto) ficam fora do carrossel
const ALL_REVIEWS = (reviews.reviews as Review[]).filter((r) => !r.hidden && r.text.trim());
const TOTAL = ALL_REVIEWS.length;
const AUTO_INTERVAL = 3500;

export default function SocialProof() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  /*
   * O carrossel 3D joga os cards vizinhos 280px e 480px para os lados. Numa
   * tela de 375px isso vira uma pilha ilegível, então no celular mostramos
   * um card por vez, do tamanho da tela, navegando por arrasto.
   */
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % TOTAL);
  }, []);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + TOTAL) % TOTAL);
  }, []);

  const goTo = useCallback((idx: number) => {
    setActive(idx);
  }, []);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(next, AUTO_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  // positions relative to active: -2, -1, 0, +1, +2
  function getCardStyle(idx: number): React.CSSProperties {
    let offset = idx - active;
    // wrap around
    if (offset > TOTAL / 2) offset -= TOTAL;
    if (offset < -TOTAL / 2) offset += TOTAL;

    const absOffset = Math.abs(offset);
    const sign = offset < 0 ? -1 : offset > 0 ? 1 : 0;

    if (isMobile) {
      return absOffset === 0
        ? { opacity: 1, zIndex: 10, transition: 'opacity 0.4s ease' }
        : { display: 'none' };
    }

    if (absOffset > 2) {
      return { display: 'none' };
    }

    const translateX = sign * (absOffset === 1 ? 280 : 480);
    const translateZ = absOffset === 0 ? 0 : absOffset === 1 ? -80 : -200;
    const rotateY = sign * (absOffset === 1 ? 28 : 48);
    const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.85 : 0.68;
    const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.7 : 0.35;
    const zIndex = 10 - absOffset * 3;

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.6s ease',
    };
  }

  return (
    <section className="py-12 sm:py-28 bg-white border-t border-b border-brand-gray-200 overflow-hidden">
      <div className="container-site">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black">
            O que nossos clientes dizem
          </h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-12 mb-10 sm:mb-20">
          <div className="text-center">
            <p className="text-xl sm:text-5xl font-black text-brand-black mb-1 sm:mb-2">+12.000</p>
            <p className="text-xs sm:text-sm leading-snug text-brand-gray-600">JiuJiteiros felizes</p>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-5xl font-black text-brand-black mb-1 sm:mb-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              5 <StarRating rating={5} />
            </div>
            <p className="text-xs sm:text-sm leading-snug text-brand-gray-600">Avaliações verificadas</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-5xl font-black text-brand-black mb-1 sm:mb-2">Alto Padrão</p>
            <p className="text-xs sm:text-sm leading-snug text-brand-gray-600">Do design ao tatame</p>
          </div>
        </div>

        {/* Carrossel — 3D no desktop, um card por vez (com arrasto) no celular */}
        <div
          className="relative mx-auto h-[260px] sm:h-[280px]"
          style={{ maxWidth: 1100, perspective: '1200px' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            setPaused(true);
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            touchStartX.current = null;
            setPaused(false);
            if (start === null) return;
            const delta = e.changedTouches[0].clientX - start;
            if (Math.abs(delta) < 40) return;
            if (delta < 0) next();
            else prev();
          }}
        >
          {/* Cards */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {ALL_REVIEWS.map((review, idx) => (
              <div
                key={review.id}
                onClick={() => goTo(idx)}
                className="absolute cursor-pointer w-[min(320px,calc(100vw-2.5rem))] sm:w-[320px]"
                style={getCardStyle(idx)}
              >
                <div
                  className="bg-white border border-brand-gray-200 rounded-xl px-6 py-5 shadow-md select-none"
                  style={{
                    boxShadow:
                      idx === active
                        ? '0 20px 60px -10px rgba(0,0,0,0.18)'
                        : '0 4px 20px -4px rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {review.photo && (
                        <ReviewAvatar src={review.photo} name={review.name} focus={review.photoFocus} />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-brand-black truncate">{review.name}</p>
                        <p className="text-xs text-brand-gray-500 mt-0.5">{review.title}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-sm text-brand-gray-700 leading-relaxed line-clamp-4">{review.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Nav arrows — no celular ficariam por cima do card; lá vale o arrasto */}
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white border border-brand-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-brand-gray-400 transition-all"
            aria-label="Anterior"
          >
            <svg className="w-4 h-4 text-brand-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white border border-brand-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-brand-gray-400 transition-all"
            aria-label="Próximo"
          >
            <svg className="w-4 h-4 text-brand-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex flex-wrap items-center justify-center gap-x-1 mt-6 sm:mt-8">
          {ALL_REVIEWS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="flex h-9 items-center px-1"
              aria-label={`Ir para avaliação ${idx + 1}`}
              aria-current={idx === active}
            >
              <span
                className="block transition-all duration-300"
                style={{
                  width: idx === active ? 24 : 8,
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: idx === active ? '#171717' : '#D4D4D4',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
