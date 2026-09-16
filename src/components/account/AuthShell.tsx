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
 * Casca visual compartilhada das telas de autenticação.
 * Lado esquerdo (desktop): painel escuro com a marca — "vestiário do atleta".
 * Lado direito: o formulário, respirando, alinhado à esquerda.
 */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-[calc(100vh-124px)] grid lg:grid-cols-2">
      {/* Painel de marca — só no desktop */}
      <aside className="relative hidden lg:flex flex-col justify-between bg-brand-black text-white p-12 overflow-hidden">
        {/* Listras de ponteira de faixa, na base — o marcador de graduação da marca */}
        <div className="absolute bottom-0 left-0 right-0 h-3 flex">
          <span className="flex-1 bg-white/90" />
          <span className="w-16 bg-amber-500" />
          <span className="w-16 bg-white/90" />
        </div>

        <Link href="/" aria-label="OssPatches — início" className="relative z-10">
          <Image
            src="/images/brand/wordmark-oss-tight.svg"
            alt="OssPatches"
            width={200}
            height={80}
            className="h-12 w-auto invert"
            priority
          />
        </Link>

        <div className="relative z-10 max-w-sm">
          <p className="text-2xl font-extrabold leading-tight tracking-tight">
            Sua conta OssPatches.
          </p>
          <p className="mt-4 text-brand-gray-400 leading-relaxed">
            Acompanhe seus pedidos, guarde as peças que você quer comprar depois e
            deixe seus dados prontos para o próximo checkout.
          </p>
        </div>
      </aside>

      {/* Formulário */}
      <section className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-black">
            {title}
          </h1>
          <p className="mt-2 text-brand-gray-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-sm text-brand-gray-600">{footer}</div>}
        </div>
      </section>
    </div>
  );
}
