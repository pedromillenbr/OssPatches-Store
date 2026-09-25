import localFont from 'next/font/local';

/**
 * Fontes reais do bordado da OssPatches, servidas pelo próprio site.
 *
 * A Brantford veio do pacote com licença de webfont (pasta WebFonts), por isso
 * usamos o .woff2 dela. A Brush Script só tinha o .otf, que o next/font também
 * aceita e converte no build.
 */
export const serifFont = localFont({
  src: [
    { path: '../fonts/BrantFordTypeface-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/BrantFordTypeface-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-embroidery-serif',
});

export const scriptFont = localFont({
  src: [{ path: '../fonts/BrushScriptOpti-Regular.otf', weight: '400', style: 'normal' }],
  display: 'swap',
  variable: '--font-embroidery-script',
});

export type EmbroideryFont = 'serifada' | 'manuscrita';
export type EmbroideryColor = 'dourado' | 'branco';

export const EMBROIDERY_FONTS: {
  id: EmbroideryFont;
  label: string;
  /** Nome da fonte real, que vai para a produção. */
  production: string;
  cssVar: string;
  weight: number;
  /**
   * Chute usado só no primeiro instante, antes de o desenho se medir sozinho:
   * largura média de um caractere e altura do quadro, para uma letra de 100.
   */
  charWidth: number;
  viewHeight: number;
  baseline: number;
}[] = [
  {
    id: 'serifada',
    label: 'Clássica',
    production: 'Brantford New',
    cssVar: 'var(--font-embroidery-serif)',
    weight: 700,
    charWidth: 0.72,
    viewHeight: 120,
    baseline: 0.79,
  },
  {
    id: 'manuscrita',
    label: 'Manuscrita',
    production: 'Brush Script',
    cssVar: 'var(--font-embroidery-script)',
    weight: 400,
    charWidth: 0.6,
    viewHeight: 150,
    baseline: 0.68,
  },
];

export const EMBROIDERY_COLORS: { id: EmbroideryColor; label: string }[] = [
  { id: 'dourado', label: 'Dourado' },
  { id: 'branco', label: 'Branco' },
];

export function fontOf(id: EmbroideryFont | undefined) {
  return EMBROIDERY_FONTS.find((font) => font.id === id) || EMBROIDERY_FONTS[0];
}
