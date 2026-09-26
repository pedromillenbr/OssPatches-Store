import type { ReactNode } from 'react';

/**
 * Casca visual das páginas legais (privacidade, trocas, termos).
 *
 * As três páginas precisam ser lidas como um documento só da mesma loja —
 * manter o estilo num lugar evita que uma delas envelheça diferente.
 */
export default function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="container-site max-w-3xl py-14 md:py-20">
      <header className="border-b border-brand-gray-200 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-black">
          {title}
        </h1>
        <p className="mt-3 text-brand-gray-500">Última atualização: {updatedAt}</p>
        <div className="mt-4 leading-relaxed text-brand-gray-600">{intro}</div>
      </header>

      <div className="prose-account mt-10 space-y-10">{children}</div>
    </article>
  );
}

/** Seção numerada. O número em âmbar é o acento da marca nestas páginas. */
export function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-baseline gap-3 text-xl font-bold text-brand-black">
        <span className="text-sm font-mono text-amber-600">{n}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-brand-gray-600 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:marker:text-brand-gray-300 [&_.link]:font-semibold [&_.link]:text-brand-black [&_.link]:underline [&_.link]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

/**
 * Caixa de destaque para o prazo/regra que o cliente precisa enxergar sem ler
 * tudo (ex.: os 7 dias de arrependimento).
 */
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-amber-500 bg-amber-50/60 px-5 py-4 leading-relaxed text-brand-gray-700">
      {children}
    </div>
  );
}
