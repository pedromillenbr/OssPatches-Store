import Link from 'next/link';
import Image from 'next/image';
import { getPatchCardImage } from '@/lib/patchImages';
import { Product, PatchProduct } from '@/types';
import { formatPrice } from '@/services/products';
import clsx from 'clsx';

interface RelatedProductsProps {
  current: Product | PatchProduct;
  products: (Product | PatchProduct)[];
}

function isBelt(p: Product | PatchProduct): p is Product {
  return p.category === 'belt-adult' || p.category === 'belt-kids';
}

function BeltSwatch({ product }: { product: Product }) {
  const isRedBlack = product.color === 'red-black';
  const isRedWhite = product.color === 'red-white';
  const isBicolor = isRedBlack || isRedWhite;
  const isWhite = product.color === 'white';

  return (
    <div
      className="w-full h-full"
      style={{
        background: isBicolor
          ? `linear-gradient(to right, ${product.colorHex} 50%, ${product.colorHexSecondary} 50%)`
          : product.colorHex,
        border: isWhite ? '1px solid #D4D4D4' : 'none',
      }}
    />
  );
}

export default function RelatedProducts({ current, products }: RelatedProductsProps) {
  // Show same category, exclude current, max 4
  const related = (products ?? [])
    .filter((p) => p.slug !== current.slug && p.category === current.category)
    .slice(0, 4);

  if (related.length === 0) return null;

  const label =
    current.category === 'belt-adult'
      ? 'Outras faixas adulto'
      : current.category === 'belt-kids'
      ? 'Outras faixas infantil'
      : 'Outros patches';

  return (
    <section className="py-12 sm:py-16 border-t border-brand-gray-200">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-3">
          Veja também
        </p>
        <h3 className="text-2xl sm:text-3xl font-black text-brand-black">{label}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {related.map((product) => {
          const belt = isBelt(product) ? product : null;
          const categoryLabel =
            product.category === 'belt-adult'
              ? 'Faixa Adulto'
              : product.category === 'belt-kids'
              ? 'Faixa Infantil'
              : 'Patch BJJ';

          return (
            <Link
              key={product.slug}
              href={`/produtos/${product.slug}`}
              className="group border border-brand-gray-200 hover:border-brand-black transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Visual */}
              <div className="aspect-square bg-brand-gray-50 overflow-hidden relative">
                {belt ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-full flex items-center gap-1">
                      <div className="flex-1 h-8 rounded-sm overflow-hidden">
                        <BeltSwatch product={belt} />
                      </div>
                      <div
                        className="w-8 h-8 rounded-sm shrink-0"
                        style={{
                          backgroundColor:
                            belt.color === 'black' ? '#DC2626' : '#171717',
                          border: belt.color === 'white' ? '1px solid #D4D4D4' : 'none',
                        }}
                      />
                    </div>
                  </div>
                ) : getPatchCardImage(product.slug, product.images) ? (
                  <Image
                    src={getPatchCardImage(product.slug, product.images) as string}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-brand-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🥋</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-brand-gray-400 uppercase tracking-wider mb-1">
                  {categoryLabel}
                </p>
                <p className="font-bold text-sm text-brand-black group-hover:underline leading-tight mb-2">
                  {product.name}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      'text-sm font-black',
                      belt
                        ? 'text-brand-black'
                        : 'text-brand-black'
                    )}
                  >
                    {formatPrice((product as Product).basePrice)}
                  </span>
                  <span className="text-xs text-brand-gray-400 group-hover:text-brand-black transition-colors">
                    Ver →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
