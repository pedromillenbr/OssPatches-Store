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
  /** A clássica é bordada sempre em maiúsculas; a manuscrita, não. */
  uppercase: boolean;
  placeholder: string;
  caseHint: string;
  /**
   * Quanto da largura da faixa o desenho ocupa. A clássica é só maiúscula,
   * então ocupa pouco. A manuscrita tem letras que sobem e descem (o "P" e o
   * "ç" de "Persistência"), então precisa de mais espaço na faixa.
   */
  frameRatio: number;
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
    uppercase: true,
    placeholder: 'PEDRO ALVAREZ',
    caseHint: 'A clássica é bordada sempre em MAIÚSCULAS.',
    frameRatio: 0.375,
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
    uppercase: false,
    placeholder: 'Persistência',
    caseHint: 'A manuscrita é bordada do jeito que você escrever.',
    frameRatio: 0.6,
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
 * Proporção do campo bordado para cada fonte: os 14cm de largura divididos
 * pela altura que aquela fonte ocupa na faixa. É esse número que decide a
 * partir de quantas letras o nome começa a ser apertado — "L. AGUIAR" dá
 * 13,5cm e fica no limite, exatamente como na peça real.
 */
export function embroideryFieldAspect(font: EmbroideryFont | undefined): number {
  return MAX_EMBROIDERY_CM / (BELT_WIDTH_CM * fontOf(font).frameRatio);
}

export const EMBROIDERY_COLORS: { id: EmbroideryColor; label: string }[] = [
  { id: 'dourado', label: 'Dourado' },
  { id: 'branco', label: 'Branco' },
];

export function fontOf(id: EmbroideryFont | undefined) {
  return EMBROIDERY_FONTS.find((font) => font.id === id) || EMBROIDERY_FONTS[0];
}

/**
 * Deixa o texto na caixa em que ele será bordado. O nome é guardado do jeito
 * que o cliente digitou, e a caixa é aplicada aqui — assim trocar de fonte não
 * perde o que ele escreveu.
 */
export function applyEmbroideryCase(name: string, font: EmbroideryFont | undefined): string {
  const trimmed = name.trim();
  return fontOf(font).uppercase ? trimmed.toUpperCase() : trimmed;
}
