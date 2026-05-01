'use client';

interface BeltSizeGuide {
  size: string;
  length: string;
  width: string;
}

const BELT_SIZES_CHILDREN: BeltSizeGuide[] = [
  { size: 'M1', length: '1.40m', width: '4cm' },
  { size: 'M2', length: '1.50m', width: '4cm' },
  { size: 'M3', length: '1.60m', width: '4cm' },
  { size: 'M4', length: '1.70m', width: '4cm' },
  { size: 'A0', length: '1.80m', width: '4.5cm' },
  { size: 'A1', length: '1.90m', width: '4.5cm' },
  { size: 'A2', length: '2.00m', width: '4.5cm' },
];

const BELT_SIZES_ADULTS: BeltSizeGuide[] = [
  { size: 'A0', length: '2.00m', width: '4.5cm' },
  { size: 'A1', length: '2.10m', width: '4.5cm' },
  { size: 'A2', length: '2.20m', width: '4.5cm' },
  { size: 'A3', length: '2.30m', width: '4.5cm' },
  { size: 'A4', length: '2.40m', width: '4.5cm' },
  { size: 'A5', length: '2.50m', width: '4.5cm' },
];

interface BeltSizeGuideComponentProps {
  isKids?: boolean;
}

export default function BeltSizeGuideComponent({ isKids = false }: BeltSizeGuideComponentProps) {
  const sizes = isKids ? BELT_SIZES_CHILDREN : BELT_SIZES_ADULTS;

  return (
    <section className="py-12 sm:py-16 bg-brand-gray-50 border-t border-b border-brand-gray-200">
      <div className="container-site">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-3">
            Guia de Medidas
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-brand-black mb-2">
            Escolha o tamanho correto
          </h3>
          <p className="text-sm text-brand-gray-600">
            Medidas padrão IBJJF para o melhor encaixe e conforto no tatame
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-brand-gray-300">
                <th className="text-left py-3 px-4 font-bold text-brand-black">Tamanho</th>
                <th className="text-left py-3 px-4 font-bold text-brand-black">Comprimento</th>
                <th className="text-left py-3 px-4 font-bold text-brand-black">Largura</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((size, i) => (
                <tr
                  key={i}
                  className={`border-b border-brand-gray-200 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-brand-gray-100'
                  } hover:bg-orange-50 transition-colors`}
                >
                  <td className="py-3 px-4 font-bold text-brand-black">{size.size}</td>
                  <td className="py-3 px-4 text-brand-gray-700">{size.length}</td>
                  <td className="py-3 px-4 text-brand-gray-700">{size.width}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-brand-gray-700">
          <p className="font-semibold text-orange-900 mb-2">💡 Dica:</p>
          <p>
            Meça sua faixa atual do início até a ponta final, sem contar a ponta bordada, para encontrar o tamanho ideal.
          </p>
        </div>
      </div>
    </section>
  );
}
