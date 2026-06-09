import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';

const QUICK_LINKS = [
  { label: 'Faixas Adulto',   href: '/produtos/faixa-branca-adulto' },
  { label: 'Faixas Infantil', href: '/produtos/faixa-branca-infantil' },
  { label: 'Patches',         href: '/produtos/patch-medio' },
  { label: 'Nossos Atletas',  href: '/nossos-atletas' },
  { label: 'Quem Somos',      href: '/quem-somos' },
];

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="container-site py-16 md:py-28">
        <div className="max-w-2xl mx-auto text-center">

          {/* 404 + diagonal black belt */}
          <div className="relative inline-block mb-10 select-none">
            <span className="text-[9rem] md:text-[13rem] font-black leading-none text-brand-gray-100 tracking-tighter">
              404
            </span>
            <div
              className="belt-animate absolute pointer-events-none"
              style={{
                top: '42%',
                left: '-20%',
                right: '-20%',
                height: '36px',
                background: '#0A0A0A',
                transform: 'rotate(-4deg)',
                boxShadow: '0 2px 0 #fff, 0 -2px 0 #fff, 0 4px 16px rgba(0,0,0,0.22)',
              }}
            >
              <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0,
                height: '5px', marginTop: '-2.5px',
                background: 'rgba(255,255,255,0.10)',
              }} />
            </div>
          </div>

          <h1 className="fade-up-1 text-2xl md:text-3xl font-bold text-brand-black mb-3">
            Essa posição não existe no tatame
          </h1>
          <p className="fade-up-2 text-brand-gray-500 mb-10 text-base md:text-lg leading-relaxed">
            A página que você procura foi movida, deletada ou nunca existiu.
            <br />
            Mas o treino continua — escolha um destino abaixo.
          </p>

          {/* Primary CTA */}
          <div className="fade-up-3 mb-12">
            <Link href="/">
              <Button size="lg" className="px-12 py-4 text-base font-bold tracking-wide">
                ← Voltar à loja
              </Button>
            </Link>
          </div>

          {/* Divider */}
          <div className="fade-up-4 flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-brand-gray-200" />
            <span className="text-xs text-brand-gray-400 uppercase tracking-widest font-medium">
              ou acesse diretamente
            </span>
            <div className="flex-1 h-px bg-brand-gray-200" />
          </div>

          {/* Orbit-style cards — shape from OrbitCard, sem glow azul */}
          <nav className="fade-up-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {QUICK_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative rounded-xl bg-white border border-brand-gray-200
                           overflow-hidden transition-all duration-300 ease-out
                           hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)]
                           hover:border-brand-gray-400"
                style={{ animationDelay: `${0.75 + i * 0.07}s` }}
              >
                {/* Shine sweep — lightswind pattern */}
                <span
                  className="pointer-events-none absolute top-0 left-[-75%] h-full w-[55%]
                             skew-x-[-20deg]
                             bg-gradient-to-r from-transparent via-white/70 to-transparent
                             opacity-0 group-hover:opacity-100
                             group-hover:left-[130%] group-hover:transition-all
                             group-hover:duration-500 group-hover:ease-in-out"
                />

                {/* Inner content — same padding/structure as OrbitCard */}
                <div className="relative z-10 px-3 py-6 flex flex-col items-center gap-3">

                  {/* Icon placeholder — thin line, like a belt stripe */}
                  <span
                    className="block w-6 h-0.5 bg-brand-gray-300
                               group-hover:w-10 group-hover:bg-brand-black
                               transition-all duration-300 ease-out"
                  />

                  <span className="text-xs font-semibold uppercase tracking-widest
                                   text-brand-gray-500 group-hover:text-brand-black
                                   transition-colors duration-200 leading-tight text-center">
                    {link.label}
                  </span>

                  {/* Arrow — appears on hover */}
                  <span
                    className="text-[10px] text-brand-gray-300 font-medium
                               opacity-0 -translate-y-1
                               group-hover:opacity-100 group-hover:translate-y-0
                               transition-all duration-200"
                  >
                    ↗
                  </span>
                </div>
              </Link>
            ))}
          </nav>

        </div>
      </div>
    </Layout>
  );
}
