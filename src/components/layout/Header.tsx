import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/context/AuthContext';
import AnnouncementBar from './AnnouncementBar';

export default function Header() {
  const { totalItems, toggleCart } = useCartStore();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [faixaOpen, setFaixaOpen] = useState(false);
  const [patchOpen, setPatchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = totalItems();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-brand-gray-200 shadow-sm">
      <AnnouncementBar />
      <div className="container-site py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo — wordmark oficial "OSS patches". priority: carrega primeiro (LCP). */}
          <Link
            href="/"
            aria-label="OssPatches — página inicial"
            className="shrink-0 transition-opacity duration-200 hover:opacity-80"
          >
            <Image
              src="/images/brand/wordmark-oss-tight.svg"
              alt="OssPatches"
              width={254}
              height={100}
              priority
              className="h-14 w-auto md:h-16"
            />
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

          {/* Conta + Carrinho */}
          <div className="flex items-center gap-5">
            {/* Conta */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                onBlur={() => setTimeout(() => setAccountOpen(false), 150)}
                className="flex items-center justify-center text-brand-black hover:text-brand-gray-700 transition-colors"
                aria-label="Minha conta"
                aria-expanded={accountOpen}
              >
                <AccountIcon />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-brand-gray-200 bg-white p-2 shadow-xl text-base font-medium">
                  {mounted && user ? (
                    <>
                      <Link
                        href="/minha-conta"
                        className="block rounded-xl px-4 py-3 text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-black"
                        onClick={() => setAccountOpen(false)}
                      >
                        Meus pedidos
                      </Link>
                      <Link
                        href="/minha-conta/interesses"
                        className="block rounded-xl px-4 py-3 text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-black"
                        onClick={() => setAccountOpen(false)}
                      >
                        Interesses
                      </Link>
                      <Link
                        href="/minha-conta/perfil"
                        className="block rounded-xl px-4 py-3 text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-black"
                        onClick={() => setAccountOpen(false)}
                      >
                        Meu perfil
                      </Link>
                      <button
                        onClick={async () => {
                          setAccountOpen(false);
                          await signOut();
                          router.push('/');
                        }}
                        className="mt-1 block w-full rounded-xl px-4 py-3 text-left text-brand-gray-500 hover:bg-brand-gray-50 hover:text-brand-black"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/entrar"
                        className="block rounded-xl px-4 py-3 text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-black"
                        onClick={() => setAccountOpen(false)}
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/criar-conta"
                        className="block rounded-xl px-4 py-3 text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-black"
                        onClick={() => setAccountOpen(false)}
                      >
                        Criar conta
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

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
      </div>
    </header>
  );
}

function AccountIcon() {
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
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
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
