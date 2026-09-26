import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/context/AuthContext';
import AnnouncementBar from './AnnouncementBar';

export default function Header() {
  const { totalItems, toggleCart } = useCartStore();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faixaOpen, setFaixaOpen] = useState(false);
  const [patchOpen, setPatchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Header reage ao rolar: sombra mais forte e barra levemente mais compacta.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /*
   * O header é fixo, então o conteúdo precisa de um respiro do mesmo tamanho.
   * Antes esse valor era chutado no CSS (124px) e no celular sobrava/faltava
   * espaço. Aqui ele é medido de verdade e publicado como variável --header-h,
   * que o Layout e os links âncora usam.
   */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const publish = () => {
      // Só mede com o header no tamanho "de repouso" (topo da página),
      // senão o conteúdo pularia toda vez que a barra encolhe ao rolar.
      if (window.scrollY > 8) return;
      document.documentElement.style.setProperty(
        '--header-h',
        `${Math.round(el.getBoundingClientRect().height)}px`
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    window.addEventListener('orientationchange', publish);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', publish);
    };
  }, []);

  // Menu mobile: fecha ao trocar de página e trava a rolagem do fundo.
  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Tecla Esc fecha o menu (teclado e celulares com teclado externo).
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const count = totalItems();

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b transition-shadow duration-300 ${
        scrolled ? 'border-brand-gray-200 shadow-lg' : 'border-transparent shadow-sm'
      }`}
    >
      <AnnouncementBar />
      <div
        className={`container-site transition-all duration-300 ${
          scrolled ? 'py-1.5 md:py-2' : 'py-2.5 md:py-4'
        }`}
      >
        <div className="flex items-center justify-between gap-3 md:gap-6">
          {/* Menu mobile (só aparece no celular/tablet) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="tap-target -ml-2 md:hidden text-brand-black"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>

          {/* Logo — wordmark oficial "OSS patches". priority: carrega primeiro (LCP). */}
          <Link
            href="/"
            aria-label="OssPatches — página inicial"
            className="shrink-0 transition-transform duration-200 hover:scale-105"
          >
            <Image
              src="/images/brand/wordmark-oss-trim.png"
              alt="OssPatches"
              width={1728}
              height={658}
              priority
              className={`w-auto transition-all duration-300 ${
                scrolled ? 'h-9 md:h-12' : 'h-11 md:h-16'
              }`}
            />
          </Link>

          {/* Nav desktop */}
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
                  {PATCH_LINKS.map((item, i) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-xl px-4 py-3 text-base text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-black ${
                        i > 0 ? 'mt-1' : ''
                      }`}
                      onClick={() => setPatchOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/quem-somos"
              className="group relative text-brand-gray-700 hover:text-brand-black transition-colors"
            >
              Quem Somos
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand-black transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/nossos-atletas"
              className="group relative text-brand-gray-700 hover:text-brand-black transition-colors"
            >
              Atletas
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand-black transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          {/* Conta + Carrinho */}
          <div className="flex items-center gap-1 md:gap-4">
            {/* Conta — no celular vive dentro do menu lateral */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                onBlur={() => setTimeout(() => setAccountOpen(false), 150)}
                className="tap-target text-brand-black hover:text-brand-gray-700 transition-transform duration-200 hover:scale-110"
                aria-label="Minha conta"
                aria-expanded={accountOpen}
              >
                <AccountIcon />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-brand-gray-200 bg-white p-2 shadow-xl text-base font-medium">
                  {mounted && user ? (
                    <>
                      {ACCOUNT_LINKS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-xl px-4 py-3 text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-black"
                          onClick={() => setAccountOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                      {profile?.is_admin && (
                        <Link
                          href="/admin"
                          className="block rounded-xl px-4 py-3 font-semibold text-brand-black hover:bg-brand-gray-50"
                          onClick={() => setAccountOpen(false)}
                        >
                          Painel Admin
                        </Link>
                      )}
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
              className="tap-target -mr-2 md:mr-0 relative text-brand-black hover:text-brand-gray-700 transition-transform duration-200 hover:scale-110"
              aria-label={`Abrir carrinho${count > 0 ? ` (${count} itens)` : ''}`}
            >
              <CartIcon />
              {mounted && count > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-brand-black text-white text-[0.65rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isLogged={mounted && !!user}
        isAdmin={!!profile?.is_admin}
        onSignOut={async () => {
          setMenuOpen(false);
          await signOut();
          router.push('/');
        }}
      />
    </header>
  );
}

const PATCH_LINKS = [
  { href: '/produtos/patch-pequeno', label: 'Patch Pequeno' },
  { href: '/produtos/patch-medio', label: 'Patch Médio' },
  { href: '/produtos/patch-grande', label: 'Patch Grande' },
  { href: '/produtos/kit-de-patches', label: 'Kit de Patches' },
];

const ACCOUNT_LINKS = [
  { href: '/minha-conta', label: 'Meus pedidos' },
  { href: '/minha-conta/interesses', label: 'Interesses' },
  { href: '/minha-conta/perfil', label: 'Meu perfil' },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  isLogged: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
}

/**
 * Menu lateral do celular. Antes dessa tela o site simplesmente não tinha
 * navegação abaixo de 768px: quem entrava pelo telefone só conseguia ver a
 * home e o carrinho.
 *
 * IMPORTANTE: o painel é renderizado direto no <body> por um portal, e não
 * dentro do <header>. O header usa backdrop-blur, e pelo CSS um elemento com
 * backdrop-filter vira o referencial de posicionamento dos filhos "fixed" —
 * o menu ficava preso na faixa do header e simplesmente não aparecia.
 */
function MobileMenu({ open, onClose, isLogged, isAdmin, onSignOut }: MobileMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="md:hidden" aria-hidden={!open}>
      {/* Fundo escurecido */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Painel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-brand-gray-200 px-5 py-4">
          <span className="text-sm font-bold uppercase tracking-widest text-brand-gray-400">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="tap-target -mr-2 text-brand-black"
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-4">
          <MenuGroup title="Faixas">
            <MenuLink href="/#faixas-adulto" onClick={onClose}>
              Faixas Adulto
            </MenuLink>
            <MenuLink href="/#faixas-infantil" onClick={onClose}>
              Faixas Infantil
            </MenuLink>
          </MenuGroup>

          <MenuGroup title="Patches">
            {PATCH_LINKS.map((item) => (
              <MenuLink key={item.href} href={item.href} onClick={onClose}>
                {item.label}
              </MenuLink>
            ))}
          </MenuGroup>

          <MenuGroup title="A OssPatches">
            <MenuLink href="/quem-somos" onClick={onClose}>
              Quem Somos
            </MenuLink>
            <MenuLink href="/nossos-atletas" onClick={onClose}>
              Nossos Atletas
            </MenuLink>
            <MenuLink href="/envios" onClick={onClose}>
              Política de Envios
            </MenuLink>
            <MenuLink href="/rastrear" onClick={onClose}>
              Rastrear pedido
            </MenuLink>
          </MenuGroup>

          <MenuGroup title="Minha conta">
            {isLogged ? (
              <>
                {ACCOUNT_LINKS.map((item) => (
                  <MenuLink key={item.href} href={item.href} onClick={onClose}>
                    {item.label}
                  </MenuLink>
                ))}
                {isAdmin && (
                  <MenuLink href="/admin" onClick={onClose}>
                    Painel Admin
                  </MenuLink>
                )}
                <button
                  onClick={onSignOut}
                  className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-base text-brand-gray-500 active:bg-brand-gray-100"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <MenuLink href="/entrar" onClick={onClose}>
                  Entrar
                </MenuLink>
                <MenuLink href="/criar-conta" onClick={onClose}>
                  Criar conta
                </MenuLink>
              </>
            )}
          </MenuGroup>
        </nav>

        <div className="border-t border-brand-gray-200 px-5 py-4 pb-safe">
          <Link
            href="/#faixas-adulto"
            onClick={onClose}
            className="flex min-h-[52px] w-full items-center justify-center bg-brand-black text-base font-semibold text-white active:scale-[0.98]"
          >
            Ver faixas e patches
          </Link>
        </div>
      </aside>
    </div>,
    document.body
  );
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-1 px-3 text-xs font-bold uppercase tracking-widest text-brand-gray-400">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-[48px] items-center rounded-xl px-3 text-base font-medium text-brand-gray-800 active:bg-brand-gray-100"
    >
      {children}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
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
