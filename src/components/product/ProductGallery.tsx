import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  colorHex: string;
  colorHexSecondary?: string;
  color: string;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export default function ProductGallery({
  images,
  productName,
  colorHex,
  colorHexSecondary,
  color,
  selectedIndex,
  onSelectIndex,
}: ProductGalleryProps) {
  const [internalSelected, setInternalSelected] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [scale, setScale] = useState(1.75);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = selectedIndex !== undefined ? selectedIndex : internalSelected;
  const setSelected = (i: number) => {
    setInternalSelected(i);
    onSelectIndex?.(i);
  };

  const isRedBlack = color === 'red-black';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  };

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!zoom) return;
    e.preventDefault();
    setScale((prev) => Math.min(3.5, Math.max(1.5, prev - e.deltaY * 0.003)));
  }, [zoom]);

  return (
    <div className="space-y-4">
      {/* Main display */}
      <div
        ref={containerRef}
        className={clsx(
          'aspect-square bg-brand-gray-50 border border-brand-gray-200 relative overflow-hidden',
          images.length > 0 && (zoom ? 'cursor-zoom-out' : 'cursor-zoom-in')
        )}
        onMouseEnter={() => { if (images.length > 0) { setZoom(true); setScale(1.75); } }}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        {images.length > 0 ? (
          <Image
            src={images[selected]}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-100"
            style={
              zoom
                ? {
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                    transform: `scale(${scale})`,
                  }
                : undefined
            }
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BeltVisual
              colorHex={colorHex}
              colorHexSecondary={colorHexSecondary}
              isRedBlack={isRedBlack}
              color={color}
              large
            />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2">
        {images.length > 0 ? (
          images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={clsx(
                'w-16 h-16 border-2 overflow-hidden transition-colors',
                selected === i
                  ? 'border-brand-black'
                  : 'border-brand-gray-200 hover:border-brand-gray-400'
              )}
            >
              <Image
                src={img}
                alt={`${productName} ${i + 1}`}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </button>
          ))
        ) : (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className={clsx(
                'w-16 h-16 border-2 flex items-center justify-center bg-brand-gray-50',
                i === selected
                  ? 'border-brand-black'
                  : 'border-brand-gray-200'
              )}
            >
              <div
                className="w-8 h-3 rounded-sm"
                style={{ backgroundColor: colorHex }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface BeltVisualProps {
  colorHex: string;
  colorHexSecondary?: string;
  isRedBlack: boolean;
  color: string;
  large?: boolean;
}

export function BeltVisual({
  colorHex,
  colorHexSecondary,
  isRedBlack,
  color,
  large,
}: BeltVisualProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-4',
        large ? 'w-4/5' : 'w-full'
      )}
    >
      <div className="w-full flex items-center gap-1.5">
        {isRedBlack ? (
          <>
            <div
              className="h-10 flex-1 rounded"
              style={{ backgroundColor: colorHex }}
            />
            <div
              className="h-10 flex-1 rounded"
              style={{ backgroundColor: colorHexSecondary || '#171717' }}
            />
          </>
        ) : (
          <div
            className="h-10 w-full rounded"
            style={{
              backgroundColor: colorHex,
              border: color === 'white' ? '1px solid #D4D4D4' : 'none',
            }}
          />
        )}
        <div
          className={clsx('h-10 rounded shrink-0', large ? 'w-12' : 'w-8')}
          style={{
            backgroundColor: color === 'black' ? '#DC2626' : '#171717',
            border: color === 'white' ? '1px solid #D4D4D4' : 'none',
          }}
        />
      </div>

      {/* Degree stripes preview */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((d) => (
          <div
            key={d}
            className="w-4 h-1 rounded-full opacity-40"
            style={{
              backgroundColor: color === 'white' ? '#A3A3A3' : colorHex,
            }}
          />
        ))}
      </div>

      {large && (
        <p className="text-xs text-brand-gray-400 tracking-wider">
          Visualização ilustrativa
        </p>
      )}
    </div>
  );
}
