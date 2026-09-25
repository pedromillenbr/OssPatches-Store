import { Cinzel, Yellowtail } from 'next/font/google';

/**
 * Fontes da pré-visualização do bordado.
 *
 * As fontes usadas na produção são a "Brantford New" e a "Brush Script", que
 * são licenciadas e não podem ser servidas pelo site. Usamos aqui as duas
 * parecidas mais próximas do Google Fonts — o cliente vê o estilo certo, e a
 * peça é bordada com a fonte original. Se um dia tivermos o arquivo das
 * fontes reais, basta trocar por next/font/local aqui: o resto do site não
 * muda, porque tudo lê pelas variáveis CSS abaixo.
 */
export const serifFont = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-embroidery-serif',
});

export const scriptFont = Yellowtail({
  subsets: ['latin'],
  weight: '400',
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
  /** Largura média de um caractere, em ems — usada para a peça caber na faixa. */
  charWidth: number;
  /**
   * Altura do quadro do desenho, para uma letra de 100. Sobra vertical demais
   * faz o nome encolher no meio da faixa, então cada fonte tem a sua: a
   * manuscrita precisa de espaço embaixo para as caudas das letras.
   */
  viewHeight: number;
  /** Onde fica a linha de base dentro desse quadro. */
  baseline: number;
}[] = [
  {
    id: 'serifada',
    label: 'Clássica',
    production: 'Brantford New',
    cssVar: 'var(--font-embroidery-serif)',
    charWidth: 0.78,
    viewHeight: 120,
    baseline: 0.79,
  },
  {
    id: 'manuscrita',
    label: 'Manuscrita',
    production: 'Brush Script',
    cssVar: 'var(--font-embroidery-script)',
    charWidth: 0.7,
    viewHeight: 150,
    baseline: 0.65,
  },
];

export const EMBROIDERY_COLORS: { id: EmbroideryColor; label: string }[] = [
  { id: 'dourado', label: 'Dourado' },
  { id: 'branco', label: 'Branco' },
];

export function fontOf(id: EmbroideryFont | undefined) {
  return EMBROIDERY_FONTS.find((font) => font.id === id) || EMBROIDERY_FONTS[0];
}
