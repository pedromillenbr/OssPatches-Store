/**
 * Chave pública do Mercado Pago (pode aparecer no navegador — é pública).
 *
 * O Next embute o valor no código na hora do build, então a variável
 * NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY precisa existir na Vercel (Produção)
 * ANTES do deploy. Se faltar, o valor fica vazio: sem esta checagem, o
 * MercadoPago.js lançava erro e derrubava a tela de pagamento inteira
 * (aconteceu em 12/11/2026 — o cartão nunca tinha funcionado em produção).
 */
export const MP_PUBLIC_KEY: string = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

export const CARD_PAYMENTS_AVAILABLE = MP_PUBLIC_KEY.startsWith('APP_USR-') || MP_PUBLIC_KEY.startsWith('TEST-');
