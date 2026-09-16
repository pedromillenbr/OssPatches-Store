import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const TABS = [
  { href: '/admin', label: 'Pedidos' },
  { href: '/admin/avaliacoes', label: 'Avaliações' },
];

/** Casca do painel de administração (área do dono da loja). */
export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const router = useRouter();
  return (
    <div className="container-site py-10 md:py-14">
      <div className="flex items-center gap-2 border-b border-brand-gray-200 pb-4">
        <span className="rounded bg-brand-black px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Admin
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-brand-black">{title}</h1>
      </div>

      <nav className="mt-6 flex gap-2">
        {TABS.map((tab) => {
          const active = router.pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? 'bg-brand-black text-white' : 'bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
