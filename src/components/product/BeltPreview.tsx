import clsx from 'clsx';

interface BeltPreviewProps {
  colorHex: string;
  colorHexSecondary?: string;
  color: string;
  degree: number;
  stripe?: 'none' | 'white' | 'black';
  embroideredName?: string;
  size?: string;
  compact?: boolean;
}

export default function BeltPreview({
  colorHex,
  colorHexSecondary,
  color,
  degree,
  stripe = 'none',
  embroideredName,
  size,
  compact = false,
}: BeltPreviewProps) {
  const isRedBlack = color === 'red-black';
  const isRedWhite = color === 'red-white';
  const isBicolor = isRedBlack || isRedWhite;
  const tipColor = color === 'black' ? '#DC2626' : '#171717';
  const isWhite = color === 'white';
  const h = compact ? 32 : 48;
  const tipW = compact ? 40 : 64;
  const stripeBarW = compact ? 3 : 5;

  const stripeColor =
    stripe === 'white' ? '#F5F5F5' : stripe === 'black' ? '#171717' : null;

  return (
    <div className={clsx('w-full select-none', compact ? 'py-1' : 'py-3 px-2')}>
      {/* Belt — horizontal bar layout matching real belt appearance */}
      <div className="flex items-stretch w-full" style={{ height: h }}>

        {/* Main body */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            background: isBicolor
              ? `linear-gradient(to right, ${colorHex} 50%, ${colorHexSecondary} 50%)`
              : colorHex,
            border: isWhite ? '1px solid #D4D4D4' : 'none',
          }}
        >
          {/* Horizontal stripe running the full length */}
          {stripeColor && (
            <div
              className="absolute inset-x-0"
              style={{
                height: compact ? 6 : 9,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: stripeColor,
              }}
            />
          )}

          {/* Embroidered name */}
          {embroideredName && (
            <span
              className="absolute inset-0 flex items-center justify-center font-bold tracking-widest uppercase"
              style={{
                fontSize: compact ? 8 : 11,
                color: isWhite ? '#555' : '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                opacity: 0.85,
              }}
            >
              {embroideredName}
            </span>
          )}
        </div>

        {/* Tip block with vertical degree stripes */}
        <div
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            width: tipW,
            backgroundColor: tipColor,
            border: isWhite ? '1px solid #D4D4D4' : 'none',
            flexShrink: 0,
          }}
        >
          {degree > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ gap: compact ? 4 : 6 }}
            >
              {Array.from({ length: degree }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: stripeBarW,
                    height: '100%',
                    backgroundColor: '#F5F5F5',
                    borderRadius: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Labels */}
      {!compact && (
        <div className="flex justify-between items-center mt-2 px-0.5">
          <span className="text-xs text-brand-gray-500">
            {size && <span className="font-medium">{size}</span>}
            {size && degree > 0 && <span className="mx-1 text-brand-gray-300">·</span>}
            {degree > 0 && (
              <span className="font-medium">
                {degree} {degree === 1 ? 'grau' : 'graus'}
              </span>
            )}
            {degree === 0 && !size && <span>Sem graus</span>}
          </span>
          <span className="text-xs text-brand-gray-400 italic">Visualização ilustrativa</span>
        </div>
      )}
    </div>
  );
}
