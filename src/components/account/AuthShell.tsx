import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Casca visual das telas de autenticação.
 * Conceito: uma FAIXA PRETA de jiu-jitsu como moldura grossa em volta do
 * card branco, com a ponteira de graduação (barra vermelha) na lateral
 * direita — como uma faixa preta amarrada. A logo da águia vai no topo.
 */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-124px)] items-center justify-center bg-brand-gray-50 px-4 py-12">
      {/* Moldura = faixa preta. O padding preto é a "largura" da faixa. */}
      <div className="relative w-full max-w-md rounded-[28px] bg-brand-black p-3 shadow-xl">
        {/* Barra de graus da faixa preta: segmento vermelho encaixado no cós
            preto (lado direito), com as listras pretas de graduação. */}
        <div className="absolute right-0 top-1/2 z-20 flex h-24 w-3 -translate-y-1/2 flex-col items-center justify-center gap-2 bg-red-600">
          <span className="h-2.5 w-full bg-brand-black" />
          <span className="h-2.5 w-full bg-brand-black" />
          <span className="h-2.5 w-full bg-brand-black" />
        </div>

        {/* Card branco interno */}
        <div className="relative overflow-hidden rounded-[18px] bg-white px-8 py-9">
          {/* Logo da águia */}
          <Link href="/" aria-label="OssPatches — início" className="inline-flex items-center gap-3">
            <Image
              src="/images/brand/aguia-simbolo.svg"
              alt="OssPatches"
              width={56}
              height={56}
              priority
              className="h-14 w-auto"
            />
            <span className="text-xl font-extrabold tracking-tight text-brand-black">
              OSS<span className="text-brand-gray-400">patches</span>
            </span>
          </Link>

          <h1 className="mt-7 text-2xl font-extrabold tracking-tight text-brand-black">{title}</h1>
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
