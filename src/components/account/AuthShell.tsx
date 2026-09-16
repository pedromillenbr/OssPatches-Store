import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Casca visual das telas de autenticação.
 * Card único centralizado: faixa preta de marca no topo (com a ponteira
 * âmbar/branca da graduação) + formulário compacto embaixo. Sem o painel
 * lateral gigante que deixava a tela vazia.
 */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-124px)] items-center justify-center bg-brand-gray-50 px-4 py-12">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-gray-200 bg-white shadow-sm">
        {/* Faixa preta de jiu-jitsu atravessando o topo do card, com a
            ponteira de graduação (listra vermelha + graus) na ponta direita,
            como uma faixa preta faixa-preta amarrada. */}
        <div className="relative flex h-24 items-center bg-brand-black px-8 text-white">
          <div className="relative z-10">
            <Link href="/" aria-label="OssPatches — início" className="text-2xl font-extrabold tracking-tight">
              OSS<span className="text-brand-gray-400">patches</span>
            </Link>
            <p className="mt-1 text-sm text-brand-gray-400">
              Pedidos, interesses e dados salvos.
            </p>
          </div>

          {/* Ponteira da faixa: barra vermelha com os "graus" (traços) */}
          <div className="absolute right-0 top-0 bottom-0 flex w-20 flex-col">
            <span className="h-full w-full bg-red-700" />
            <span className="absolute inset-y-0 left-3 flex flex-col justify-center gap-1.5">
              <span className="h-4 w-1 bg-white/90" />
              <span className="h-4 w-1 bg-white/90" />
              <span className="h-4 w-1 bg-white/90" />
              <span className="h-4 w-1 bg-white/90" />
            </span>
          </div>
        </div>

        {/* Formulário */}
        <div className="px-8 py-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-black">{title}</h1>
          <p className="mt-1 text-sm text-brand-gray-500">{subtitle}</p>

          <div className="mt-6">{children}</div>

          {footer && (
            <div className="mt-6 border-t border-brand-gray-100 pt-5 text-sm text-brand-gray-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
