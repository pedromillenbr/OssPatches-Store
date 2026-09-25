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
   * Chutes usados só no primeiro instante, antes de o desenho se medir
   * sozinho, para uma letra de tamanho 100: largura média de um caractere,
   * altura ocupada pelas letras e onde cai a linha de base.
   */
  charWidth: number;
  capHeight: number;
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
    capHeight: 0.72,
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
    capHeight: 1.0,
    viewHeight: 150,
    baseline: 0.68,
  },
];

/**
 * Limites reais da produção.
 *
 * A máquina borda no máximo 14cm de largura. Quando o nome passa disso, a
 * loja NÃO diminui a letra: ela aperta os lados, e a letra fica parecendo
 * esticada para cima. A pré-visualização faz o mesmo.
 */
export const MAX_EMBROIDERY_CM = 14;
/** Largura da faixa OssPatches, usada como régua da pré-visualização. */
export const BELT_WIDTH_CM = 4;
/**
 * Quanto da largura da faixa as letras ocupam: ~1,5cm numa faixa de 4cm,
 * medido nas fotos de bordados prontos. É esse número, junto com os 14cm,
 * que decide a partir de quantas letras o nome começa a ser apertado —
 * "L. AGUIAR" fica no limite, exatamente como na peça real.
 */
export const LETTER_FRAME_RATIO = 0.375;
/** Proporção do campo bordado: 14cm de largura por 1,5cm de altura. */
export const EMBROIDERY_FIELD_ASPECT =
  MAX_EMBROIDERY_CM / (BELT_WIDTH_CM * LETTER_FRAME_RATIO);

export const EMBROIDERY_COLORS: { id: EmbroideryColor; label: string }[] = [
  { id: 'dourado', label: 'Dourado' },
  { id: 'branco', label: 'Branco' },
];

export function fontOf(id: EmbroideryFont | undefined) {
  return EMBROIDERY_FONTS.find((font) => font.id === id) || EMBROIDERY_FONTS[0];
}
