'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DynamicMessage from '@/components/ui/DynamicMessage';

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 60px),
                            repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 60px)`,
        }}
      />

      <div className="container-site relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 lg:py-28">

          {/* TEXTO */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-brand-gray-100 px-3 py-1.5 mb-6">
              
              
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-black leading-[1.05] mb-6">
              Faixas <br />
              e Patches <br />
              <span className="text-brand-gray-400">Premium</span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="#faixas-adulto">
                <Button size="lg" fullWidth className="sm:w-auto">
                  Comprar agora
                </Button>
              </Link>

              <Link href="#patches">
                <Button variant="secondary" size="lg" fullWidth className="sm:w-auto">
                  Ver patches
                </Button>
              </Link>
            </div>

            <DynamicMessage step="browsing" />
          </div>

          {/* BELTS */}
          <div className="hidden lg:flex items-center justify-center">
            <BeltDisplay />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, highlight }: { label: string; highlight: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-2xl sm:text-3xl font-black text-brand-black">
        {highlight}
      </div>
      <p className="text-xs sm:text-sm text-brand-gray-600">
        {label}
      </p>
    </div>
  );
}

function BeltDisplay() {
  const [active, setActive] = useState<string | null>(null);

  const belts = [
    { color: '#F5F5F5', border: '#D4D4D4', label: 'Branca', slug: 'faixa-branca-adulto' },

    { color: '#9CA3AF', label: 'Cinza', slug: 'faixa-cinza-infantil' },
    { color: '#FFD700', label: 'Amarela', slug: 'faixa-amarela-infantil' },
    { color: '#F97316', label: 'Laranja', slug: 'faixa-laranja-infantil' },
    { color: '#22C55E', label: 'Verde', slug: 'faixa-verde-infantil' },

    { color: '#1E40AF', label: 'Azul', slug: 'faixa-azul-adulto' },
    { color: '#7C3AED', label: 'Roxa', slug: 'faixa-roxa-adulto' },
    { color: '#78350F', label: 'Marrom', slug: 'faixa-marrom-adulto' },
    { color: '#171717', label: 'Preta', slug: 'faixa-preta-adulto' },
    { color: '#DC2626', label: 'Vermelha', slug: 'faixa-vermelha-adulto' },
  ];

  return (
    <div className="relative w-full max-w-sm">

      {/* TÍTULO */}
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-black mb-8 text-center">
        Qual a sua faixa?
      </h1>

      <div className="space-y-8">
        {belts.map((belt, i) => {
          const isActive = active === belt.label;

          return (
            <Link key={belt.label} href={`/produtos/${belt.slug}`}>
              <div
                onMouseEnter={() => setActive(belt.label)}
                onMouseLeave={() => setActive(null)}
                className="flex items-center gap-6 cursor-pointer"
              >

                {/* FAIXA */}
                <div
                  className={`h-10 w-full rounded-sm shadow-sm
                              transition-all duration-500 animate-float
                              ${isActive ? 'scale-x-110 shadow-xl opacity-100' : 'opacity-50'}
                  `}
                  style={{
                    backgroundColor: belt.color,
                    border: belt.border ? `1px solid ${belt.border}` : 'none',
                    animationDelay: `${i * 0.3}s`,
                  }}
                />

                {/* TEXTO */}
                <span
                  className={`text-sm font-semibold min-w-[70px] text-right transition-all duration-300
                    ${isActive ? 'text-brand-black scale-110' : 'text-brand-gray-500'}
                  `}
                >
                  {belt.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* DECOR */}
      <div className="absolute -top-4 -right-4 w-24 h-24 border border-brand-gray-200 rounded-full opacity-40" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-brand-gray-200 rounded-full opacity-40" />
    </div>
  );
}