import ProductCard from './ProductCard';
import { getAdultBelts, getKidsBelts, getAllPatches } from '@/services/products';

export default function ProductGrid() {
  const adultBelts = getAdultBelts();
  const kidsBelts = getKidsBelts();
  const patches = getAllPatches();

  return (
    <div className="container-site py-12 sm:py-20">
      {/* Adult Belts */}
      <section id="faixas-adulto" className="mb-14 sm:mb-20">
        <SectionHeader
          label="Adulto"
          title="Faixas Adulto"
          description="Todas as graduações disponíveis. 
          Padrão IBJJF, personalização com nome bordado e graus."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {adultBelts.map((belt) => (
            <ProductCard key={belt.id} product={belt} />
          ))}
        </div>
      </section>

      {/* Kids Belts */}
      <section id="faixas-infantil" className="mb-14 sm:mb-20">
        <SectionHeader
          label="Infantil"
          title="Faixas Infantil"
          description="Faixas para crianças em tecido macio e seguro. Perfeito para os pequenos campeões."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {kidsBelts.map((belt) => (
            <ProductCard key={belt.id} product={belt} />
          ))}
        </div>
      </section>

      {/* Patches */}
      <section id="patches">
        <SectionHeader
          label="Acessórios"
          title="Patches"
          description="Patches bordados premium para personalizar seu kimono. Totalmente personalizável."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {patches.map((patch) => (
            <ProductCard key={patch.id} product={patch} />
          ))}
        </div>
      </section>
    </div>
  );
}

interface SectionHeaderProps {
  label: string;
  title: string;
  description: string;
}

function SectionHeader({ label, title, description }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 mb-5 sm:mb-8">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-1 sm:mb-2">
          {label}
        </p>
        <h2 className="section-title">{title}</h2>
      </div>
      {/*
        A descrição ficava escondida no celular (hidden sm:block). Agora ela
        aparece sempre — alinhada à esquerda embaixo do título na tela pequena.
      */}
      <p className="text-sm text-brand-gray-500 sm:max-w-xs leading-relaxed sm:text-right">
        {description}
      </p>
    </div>
  );
}
