import Link from 'next/link';
import Image from 'next/image';
import { COMPANY, companyAddressLine } from '@/config/company';

export default function Footer() {
  return (
    <footer className="bg-brand-black text-white mt-14 sm:mt-24">
      <div className="container-site py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div>
            <Image
              src="/images/brand/emblema-aguia.svg"
              alt="OssPatches"
              width={80}
              height={80}
              loading="lazy"
              className="h-20 w-20 mb-3"
            />
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
              <li>
                <Link
                  href="/minha-conta"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Minha Conta
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
                  href="/trocas-e-devolucoes"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-de-privacidade"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/termos-de-uso"
                  className="text-sm text-brand-gray-400 hover:text-white transition-colors"
                >
                  Termos de Uso
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

        {/*
          Identificação da empresa. O Decreto 7.962/2013 exige nome empresarial,
          CNPJ e endereço físico e eletrônico visíveis no site. Cada dado só
          aparece quando está preenchido em src/config/company.ts.
        */}
        <div className="border-t border-brand-gray-800 mt-10 sm:mt-12 pt-6 sm:pt-8">
          <address className="text-xs not-italic leading-relaxed text-brand-gray-500 space-y-1">
            {COMPANY.legalName && <p>{COMPANY.legalName}</p>}
            {COMPANY.cnpj && <p>CNPJ {COMPANY.cnpj}</p>}
            <p>{companyAddressLine()}</p>
            <p>
              <a
                href={`mailto:${COMPANY.email}`}
                className="hover:text-white transition-colors"
              >
                {COMPANY.email}
              </a>
            </p>
          </address>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-brand-gray-500">
              © {new Date().getFullYear()} OssPatches. Todos os direitos
              reservados.
            </p>
            <p className="text-xs text-brand-gray-600">
              Produção nacional • Envio mundial • Qualidade premium
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
