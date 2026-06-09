'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import reviews from '@/data/reviews.json';
import StarRating from '@/components/ui/StarRating';

const ALL_REVIEWS = reviews.reviews;
const TOTAL = ALL_REVIEWS.length;
const AUTO_INTERVAL = 3500;

export default function SocialProof() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <section className="py-20 sm:py-28 bg-white border-t border-b border-brand-gray-200 overflow-hidden">
      <div className="container-site">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mb-6">
            O que nossos clientes dizem
          </h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mb-20">
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-black text-brand-black mb-2">+12.000</p>
            <p className="text-sm text-brand-gray-600">JiuJiteiros felizes</p>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black text-brand-black mb-2 flex items-center justify-center gap-2">
              5 <StarRating rating={5} />
            </div>
            <p className="text-sm text-brand-gray-600">Avaliações verificadas</p>
          </div>
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-black text-brand-black mb-2">Alto Padrão</p>
            <p className="text-sm text-brand-gray-600">Do design ao tatame</p>
          </div>
        </div>

        {/* 3D Carousel */}
        <div
          className="relative mx-auto"
          style={{ height: 280, maxWidth: 1100, perspective: '1200px' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Cards */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {ALL_REVIEWS.map((review, idx) => (
              <div
                key={review.id}
                onClick={() => goTo(idx)}
                className="absolute cursor-pointer"
                style={{
                  width: 320,
                  ...getCardStyle(idx),
                }}
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
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm text-brand-black">{review.name}</p>
                      <p className="text-xs text-brand-gray-500 mt-0.5">{review.title}</p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-sm text-brand-gray-700 leading-relaxed line-clamp-4">{review.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Nav arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white border border-brand-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-brand-gray-400 transition-all"
            aria-label="Anterior"
          >
            <svg className="w-4 h-4 text-brand-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white border border-brand-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-brand-gray-400 transition-all"
            aria-label="Próximo"
          >
            <svg className="w-4 h-4 text-brand-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {ALL_REVIEWS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="transition-all duration-300"
              style={{
                width: idx === active ? 24 : 8,
                height: 8,
                borderRadius: 99,
                backgroundColor: idx === active ? '#171717' : '#D4D4D4',
              }}
              aria-label={`Ir para avaliação ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
