import { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Casca visual das telas de autenticação.
 * Conceito: uma FAIXA PRETA de jiu-jitsu como moldura grossa em volta do
 * card branco, com uma tira vermelha (a barra da faixa) descendo pela
 * lateral direita.
 */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100svh-var(--header-h,110px))] items-center justify-center bg-brand-gray-50 px-4 py-8 sm:py-12">
      {/* Moldura = faixa preta. O padding preto é a "largura" da faixa. */}
      <div className="relative w-full max-w-md rounded-[28px] bg-brand-black p-3 shadow-xl">
        {/* Tira vermelha (barra da faixa) na lateral direita — compacta */}
        <div className="absolute right-0 top-1/2 z-20 h-20 w-2.5 -translate-y-1/2 bg-red-600" />

        {/* Card branco interno */}
        <div className="relative overflow-hidden rounded-[18px] bg-white px-5 py-7 sm:px-8 sm:py-9">
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
