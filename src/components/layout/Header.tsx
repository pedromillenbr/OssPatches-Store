import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function Header() {
  const { totalItems, toggleCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [faixaOpen, setFaixaOpen] = useState(false);
  const [patchOpen, setPatchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = totalItems();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-brand-gray-200 shadow-sm">
      <div className="container-site py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 font-bold tracking-tight text-brand-black"
          >
            <span className="text-3xl">Oss</span>
            <span className="text-brand-gray-400 font-light text-2xl">|</span>
            <span className="text-xl md:text-2xl font-semibold">Patches</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-10 text-lg font-semibold">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFaixaOpen((prev) => !prev)}
                onBlur={() => setTimeout(() => setFaixaOpen(false), 150)}
                className="inline-flex items-center gap-2 text-brand-gray-700 hover:text-brand-black transition-colors"
                aria-expanded={faixaOpen}
              >
                Faixa
                <span className={`transition-transform duration-200 ${faixaOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {faixaOpen && (
                <div className="absolute left-0 mt-3 w-52 rounded-2xl border border-brand-gray-200 bg-white p-2 shadow-xl">
                  <Link
                    href="/#faixas-adulto"
                    className="block rounded-xl px-4 py-3 text-base text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-black"
                    onClick={() => setFaixaOpen(false)}
                  >
                    Faixas Adulto
                  </Link>
                  <Link
                    href="/#faixas-infantil"
                    className="mt-1 block rounded-xl px-4 py-3 text-base text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-black"
                    onClick={() => setFaixaOpen(false)}
                  >
                    Faixas Infantil
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setPatchOpen((prev) => !prev)}
                onBlur={() => setTimeout(() => setPatchOpen(false), 150)}
                className="inline-flex items-center gap-2 text-brand-gray-700 hover:text-brand-black transition-colors"
                aria-expanded={patchOpen}
              >
                Patches
                <span className={`transition-transform duration-200 ${patchOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {patchOpen && (
                <div className="absolute left-0 mt-3 w-64 rounded-2xl border border-brand-gray-200 bg-white p-2 shadow-xl">
                  <Link
                    href="/produtos/patch-pequeno"
                    className="block rounded-xl px-4 py-3 text-base text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-black"
                    onClick={() => setPatchOpen(false)}
                  >
                    Patch Pequeno
                  </Link>
                  <Link
                    href="/produtos/patch-medio"
                    className="mt-1 block rounded-xl px-4 py-3 text-base text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-black"
                    onClick={() => setPatchOpen(false)}
                  >
                    Patch Médio
                  </Link>
                  <Link
                    href="/produtos/patch-grande"
                    className="mt-1 block rounded-xl px-4 py-3 text-base text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-black"
                    onClick={() => setPatchOpen(false)}
                  >
                    Patch Grande
                  </Link>
                  <Link
                    href="/produtos/kit-de-patches"
                    className="mt-1 block rounded-xl px-4 py-3 text-base text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-black"
                    onClick={() => setPatchOpen(false)}
                  >
                    Kit de Patches
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/quem-somos"
              className="text-brand-gray-700 hover:text-brand-black transition-colors"
            >
              Quem Somos
            </Link>
            <Link
              href="/nossos-atletas"
              className="text-brand-gray-700 hover:text-brand-black transition-colors"
            >
              Atletas
            </Link>
          </nav>

          {/* Cart */}
          <button
            onClick={toggleCart}
            className="relative flex items-center justify-center text-brand-black hover:text-brand-gray-700 transition-colors"
            aria-label="Abrir carrinho"
          >
            <CartIcon />
            {mounted && count > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-black text-white text-[0.65rem] font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}
