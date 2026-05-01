import Link from 'next/link';
import { Product, PatchProduct } from '@/types';
import { formatPrice } from '@/services/products';
import clsx from 'clsx';

interface ProductCardProps {
  product: Product | PatchProduct;
}

function isBelt(p: Product | PatchProduct): p is Product {
  return p.category === 'belt-adult' || p.category === 'belt-kids';
}

export default function ProductCard({ product }: ProductCardProps) {
  const belt = isBelt(product) ? product : null;
  const patch = !isBelt(product) ? product : null;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group block card-hover"
    >
      <div className="border border-brand-gray-200 bg-white overflow-hidden hover:border-brand-gray-400 transition-colors duration-300">
        {/* Color/Image area */}
        <div className="relative aspect-square bg-brand-gray-50 overflow-hidden">
          {belt ? (
            <BeltPreview belt={belt} />
          ) : (
            <PatchPreview />
          )}

          {/* Badge */}
          {'badge' in product && product.badge && (
            <span className="absolute top-3 left-3 bg-brand-black text-white text-xs font-semibold px-2.5 py-1">
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-brand-gray-400 uppercase tracking-wider mb-1">
                {product.category === 'belt-adult'
                  ? 'Faixa Adulto'
                  : product.category === 'belt-kids'
                  ? 'Faixa Infantil'
                  : 'Patch'}
              </p>
              <h3 className="font-semibold text-brand-black text-sm leading-snug">
                {product.shortName}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-brand-black text-sm">
                {formatPrice(product.basePrice)}
              </p>
              {product.customPrice > product.basePrice && (
                <p className="text-xs text-brand-gray-400">
                  Custom: {formatPrice(product.customPrice)}
                </p>
              )}
            </div>
          </div>

          {/* Sizes preview */}
          <div className="mt-3 flex items-center gap-1">
            {belt && (
              <>
                {belt.sizes.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="text-xs border border-brand-gray-200 px-1.5 py-0.5 text-brand-gray-500"
                  >
                    {s}
                  </span>
                ))}
              </>
            )}
            {patch && (
              <>
                {patch.sizes.map((s) => (
                  <span
                    key={s}
                    className="text-xs border border-brand-gray-200 px-1.5 py-0.5 text-brand-gray-500"
                  >
                    {s}
                  </span>
                ))}
              </>
            )}
          </div>

          {/* CTA */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-brand-gray-400">
              Personalização disponível
            </span>
            <span className="text-xs font-semibold text-brand-black group-hover:underline">
              Ver produto →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function BeltPreview({ belt }: { belt: Product }) {
  const isRedBlack = belt.color === 'red-black';
  const isRedWhite = belt.color === 'red-white';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-3">
      {/* Belt visual */}
      <div className="w-full flex items-center gap-1">
        {isRedBlack ? (
          <>
            <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: '#DC2626' }} />
            <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: '#171717' }} />
          </>
        ) : isRedWhite ? (
          <>
            <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: '#DC2626' }} />
            <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: '#F5F5F5' }} />
          </>
        ) : (
          <div
            className="h-6 w-full rounded-sm"
            style={{
              backgroundColor: belt.colorHex,
              border: belt.color === 'white' ? '1px solid #D4D4D4' : 'none',
            }}
          />
        )}
        <div
          className="w-8 h-6 rounded-sm shrink-0"
          style={{
            backgroundColor:
              belt.color === 'black' ? '#DC2626' : '#171717',
            border: belt.color === 'white' ? '1px solid #D4D4D4' : 'none',
          }}
        />
      </div>

      {/* Belt stripe lines */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((degree) => (
          <div
            key={degree}
            className="w-3 h-0.5"
            style={{
              backgroundColor:
                belt.color === 'white' ? '#D4D4D4' : belt.colorHex,
              opacity: degree === 0 ? 0 : 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PatchPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-4 border-brand-gray-200 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-brand-gray-300 flex items-center justify-center">
          <span className="text-xs font-bold text-brand-gray-400 tracking-wider">
            OSS
          </span>
        </div>
      </div>
    </div>
  );
}
