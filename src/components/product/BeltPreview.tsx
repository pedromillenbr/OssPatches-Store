import { useId } from 'react';
import clsx from 'clsx';
import {
  EmbroideryColor,
  EmbroideryFont,
  fontOf,
  serifFont,
  scriptFont,
} from '@/lib/embroideryFonts';

interface BeltPreviewProps {
  colorHex: string;
  colorHexSecondary?: string;
  color: string;
  degree: number;
  stripe?: 'none' | 'white' | 'black';
  embroideredName?: string;
  nameFont?: EmbroideryFont;
  nameColor?: EmbroideryColor;
  size?: string;
  compact?: boolean;
}

/**
 * Nome bordado, desenhado em SVG.
 *
 * O viewBox cresce junto com o número de letras e o SVG se encaixa sozinho no
 * espaço disponível: nome curto sai grande, nome longo sai menor — igual à
 * faixa de verdade, onde o bordado tem que caber na largura da peça.
 */
function EmbroideredName({
  name,
  font,
  color,
  onLightBelt,
}: {
  name: string;
  font: EmbroideryFont;
  color: EmbroideryColor;
  onLightBelt: boolean;
}) {
  const id = useId();
  const gradientId = `thread-${id.replace(/:/g, '')}`;
  const spec = fontOf(font);

  const letters = name.trim().toUpperCase();
  if (!letters) return null;

  const FONT_SIZE = 100;
  // Folga proposital: se a conta errar para mais sobra margem, se errar para
  // menos o nome seria cortado.
  const width = Math.max(letters.length, 4) * FONT_SIZE * spec.charWidth;
  const height = spec.viewHeight;
  const baseline = height * spec.baseline;

  const isGold = color === 'dourado';
  // Fio branco em faixa branca sumiria, então ganha um contorno discreto.
  const needsOutline = !isGold && onLightBelt;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label={`Nome ${letters} bordado na faixa`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {isGold ? (
            <>
              <stop offset="0%" stopColor="#F9E79B" />
              <stop offset="38%" stopColor="#D9A93B" />
              <stop offset="62%" stopColor="#B8860B" />
              <stop offset="100%" stopColor="#EBD489" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#F2F2F0" />
              <stop offset="100%" stopColor="#DCDCD8" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Sombra: dá o relevo do fio sobre o tecido. */}
      <text
        x={width / 2}
        y={baseline}
        textAnchor="middle"
        fontSize={FONT_SIZE}
        fontFamily={spec.cssVar}
        fontWeight={font === 'serifada' ? 700 : 400}
        fill="rgba(0,0,0,0.38)"
        transform="translate(0, 4)"
      >
        {letters}
      </text>

      <text
        x={width / 2}
        y={baseline}
        textAnchor="middle"
        fontSize={FONT_SIZE}
        fontFamily={spec.cssVar}
        fontWeight={font === 'serifada' ? 700 : 400}
        fill={`url(#${gradientId})`}
        stroke={needsOutline ? 'rgba(0,0,0,0.25)' : undefined}
        strokeWidth={needsOutline ? 1.5 : undefined}
        paintOrder="stroke"
      >
        {letters}
      </text>
    </svg>
  );
}

export default function BeltPreview({
  colorHex,
  colorHexSecondary,
  color,
  degree,
  stripe = 'none',
  embroideredName,
  nameFont = 'serifada',
  nameColor = 'dourado',
  size,
  compact = false,
}: BeltPreviewProps) {
  const isRedBlack = color === 'red-black';
  const isRedWhite = color === 'red-white';
  const isBicolor = isRedBlack || isRedWhite;
  const tipColor = color === 'black' ? '#DC2626' : '#171717';
  const isWhite = color === 'white';
  // Faixa bem mais alta que antes: o bordado precisa ser lido de verdade.
  const h = compact ? 40 : 104;
  const tipW = compact ? 48 : 112;
  const stripeBarW = compact ? 3 : 6;

  const stripeColor =
    stripe === 'white' ? '#F5F5F5' : stripe === 'black' ? '#171717' : null;

  return (
    <div
      className={clsx(
        'w-full select-none',
        serifFont.variable,
        scriptFont.variable,
        compact ? 'py-1' : 'py-3'
      )}
    >
      {/* Belt — horizontal bar layout matching real belt appearance */}
      <div
        className={clsx('flex items-stretch w-full', !compact && 'shadow-sm')}
        style={{ height: h }}
      >
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
          {/* Trama do tecido: listras finas que dão textura de faixa. */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, rgba(0,0,0,0.10) 1px 3px)',
            }}
          />

          {/* Horizontal stripe running the full length */}
          {stripeColor && (
            <div
              className="absolute inset-x-0"
              style={{
                height: compact ? 7 : 16,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: stripeColor,
              }}
            />
          )}

          {/* Embroidered name */}
          {embroideredName && embroideredName.trim() && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ padding: compact ? '3px 8px' : '8px 18px' }}
            >
              <EmbroideredName
                name={embroideredName}
                font={nameFont}
                color={nameColor}
                onLightBelt={isWhite}
              />
            </div>
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
              style={{ gap: compact ? 4 : 8 }}
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
