import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    href: '/minha-conta',
    label: 'Pedidos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    ),
  },
  {
    href: '/minha-conta/interesses',
    label: 'Interesses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    href: '/minha-conta/perfil',
    label: 'Perfil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

/**
 * Layout compartilhado da área "Minha Conta".
 * A navegação usa a linguagem visual da faixa: uma barra vertical âmbar
 * (ponteira de graduação) marca a seção ativa.
 */
export default function AccountLayout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Atleta';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="container-site py-10 md:py-14">
      {/* Cabeçalho: credencial do atleta */}
      <div className="flex items-center gap-4 border-b border-brand-gray-200 pb-8">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-black">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-extrabold tracking-tight text-brand-black">
            {displayName}
          </p>
          <p className="truncate text-sm text-brand-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-auto text-sm font-medium text-brand-gray-500 hover:text-brand-black"
        >
          Sair
        </button>
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[220px_1fr]">
        {/* Navegação lateral (desktop) / topo (mobile) */}
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'text-brand-black'
                    : 'text-brand-gray-500 hover:text-brand-black'
                }`}
              >
                {/* Marcador de faixa: barra âmbar quando ativo */}
                <span
                  className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-amber-500 transition-opacity ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Conteúdo */}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-black">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
