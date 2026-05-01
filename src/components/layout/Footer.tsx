import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-black text-white mt-24">
      <div className="container-site py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="text-2xl font-bold mb-4">OssPatches</div>
            <p className="text-brand-gray-400 text-sm leading-relaxed">
              Faixas e patches premium de Jiu-Jitsu. Produção própria, padrão
              competição e envio para todo o mundo.
            </p>
            <p className="mt-4 text-brand-gray-500 text-xs">
              OSS — Respeito e dedicação
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4 text-sm tracking-widest uppercase text-brand-gray-400">
              Produtos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#faixas-adulto"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Faixas Adulto
                </Link>
              </li>
              <li>
                <Link
                  href="/#faixas-infantil"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Faixas Infantil
                </Link>
              </li>
              <li>
                <Link
                  href="/#patches"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Patches
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-sm tracking-widest uppercase text-brand-gray-400">
              Empresa
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/quem-somos"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link
                  href="/nossos-atletas"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Nossos Atletas
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4 text-sm tracking-widest uppercase text-brand-gray-400">
              Informações
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/envios"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Política de Envios
                </Link>
              </li>
              <li>
                <Link
                  href="/trocas"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <a
                  href="https://instagram.com/osspatches"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-gray-500">
            © {new Date().getFullYear()} OssPatches. Todos os direitos
            reservados.
          </p>
          <p className="text-xs text-brand-gray-600">
            Produção nacional • Envio mundial • Qualidade premium
          </p>
        </div>
      </div>
    </footer>
  );
}
