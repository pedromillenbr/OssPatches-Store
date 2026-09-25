import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  BELT_WIDTH_CM,
  EmbroideryColor,
  EmbroideryFont,
  MAX_EMBROIDERY_CM,
  applyEmbroideryCase,
  embroideryFieldAspect,
  fontOf,
  serifFont,
  scriptFont,
} from '@/lib/embroideryFonts';

/** useLayoutEffect avisa no servidor; no servidor não há o que medir. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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

type Box = { width: number };

/**
 * Nome bordado, desenhado em SVG.
 *
 * A altura das letras é SEMPRE a mesma, como na produção. O que muda é a
 * largura: o campo bordado tem 14cm e, quando o nome não cabe, as letras são
 * apertadas para os lados em vez de diminuídas — ficam com aquele aspecto de
 * esticadas para cima.
 *
 * Para saber quando apertar, o desenho se mede sozinho: depois que a fonte
 * carrega, perguntamos ao navegador a largura real das letras.
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
  const letters = applyEmbroideryCase(name, font);

  const textRef = useRef<SVGTextElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  const FONT_SIZE = 100;
  // Altura das letras: constante por fonte, NÃO medida (ver embroideryFonts.ts).
  const inkAbove = FONT_SIZE * spec.inkAbove;
  const inkHeight = inkAbove + FONT_SIZE * spec.inkBelow;
  // O campo bordado tem 14cm de largura para essa altura de letra.
  const fieldWidth = inkHeight * embroideryFieldAspect(font);

  // Largura natural do nome: essa sim o navegador mede bem.
  const guessWidth = Math.max(letters.length, 1) * FONT_SIZE * spec.charWidth;
  const naturalWidth = box ? box.width : guessWidth;

  useIsomorphicLayoutEffect(() => {
    if (!textRef.current || !letters) return;
    let alive = true;

    const measure = () => {
      if (!alive || !textRef.current) return;
      try {
        const measured = textRef.current.getBBox();
        if (measured.width > 0) setBox({ width: measured.width });
      } catch {
        // getBBox falha se o elemento ainda não estiver renderizado; o
        // enquadramento aproximado continua valendo.
      }
    };

    measure();
    // A primeira medida pode pegar a fonte substituta, então refazemos quando
    // a fonte real termina de carregar.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      alive = false;
    };
  }, [letters, font]);

  if (!letters) return null;

  /*
   * O quadro tem sempre a altura das letras, e a largura é a maior entre o
   * campo de 14cm e o nome. Com preserveAspectRatio="none", o SVG estica o
   * quadro até preencher a caixa: quando o nome passa dos 14cm, sobra largura
   * no quadro e o desenho é comprimido na horizontal — exatamente o que a
   * produção faz. A altura nunca muda.
   */
  const viewWidth = Math.max(naturalWidth, fieldWidth);

  const isGold = color === 'dourado';
  // Fio branco em faixa branca sumiria, então ganha um contorno discreto.
  const needsOutline = !isGold && onLightBelt;

  const textProps = {
    x: 0,
    y: inkAbove,
    textAnchor: 'middle' as const,
    fontSize: FONT_SIZE,
    fontFamily: spec.cssVar,
    fontWeight: spec.weight,
  };

  return (
    <svg
      viewBox={`${-viewWidth / 2} 0 ${viewWidth} ${inkHeight}`}
      preserveAspectRatio="none"
      className="h-full w-full"
      role="img"
      aria-label={`Nome ${letters} bordado na faixa`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {isGold ? (
            <>
              {/* Dourado do fio real: mais fosco e claro que um dourado puro. */}
              <stop offset="0%" stopColor="#EFDDA8" />
              <stop offset="38%" stopColor="#CBAE6A" />
              <stop offset="62%" stopColor="#B08F4B" />
              <stop offset="100%" stopColor="#DFCB92" />
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

      {/* Régua invisível: mede só a largura natural do nome. */}
      <text {...textProps} ref={textRef} visibility="hidden" aria-hidden>
        {letters}
      </text>

      {/* Sombra: dá o relevo do fio sobre o tecido. */}
      <text {...textProps} fill="rgba(0,0,0,0.38)" transform="translate(0 3)">
        {letters}
      </text>

      <text
        {...textProps}
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

          {/* Embroidered name — caixa do tamanho real do campo bordado */}
          {embroideredName && embroideredName.trim() && (
            <div className="absolute inset-0 flex items-center justify-center px-2">
              <div
                style={{
                  // A faixa tem BELT_WIDTH_CM de largura, então cada cm vale
                  // h / BELT_WIDTH_CM pixels aqui dentro.
                  width: (h / BELT_WIDTH_CM) * MAX_EMBROIDERY_CM,
                  height: h * fontOf(nameFont).frameRatio,
                  maxWidth: '100%',
                }}
              >
                  <EmbroideredName
                  name={embroideredName}
                  font={nameFont}
                  color={nameColor}
                  onLightBelt={isWhite}
                />
              </div>
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
