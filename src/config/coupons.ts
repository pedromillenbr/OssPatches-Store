/**
 * Fonte única de verdade dos cupons — lado servidor apenas, nunca importado
 * em código de cliente (senão os códigos vazariam no bundle do navegador).
 *
 * `active` aqui é só o valor PADRÃO. O liga/desliga do dia a dia é feito no
 * painel admin (/admin/cupons) e fica guardado no Redis — ver `couponUsage.ts`.
 */
export interface CouponRule {
  /** Desconto em % sobre o subtotal dos produtos (nunca sobre o frete). */
  percent: number;
  /** Estado padrão quando não há nada gravado no Redis. */
  activeByDefault: boolean;
  /**
   * Quantas COMPRAS PAGAS o mesmo cliente (identificado pelo e-mail) pode
   * fazer com este cupom. Não é quantidade de produtos: são pedidos
   * distintos. 0 = ilimitado.
   */
  maxUsesPerCustomer: number;
}

export const COUPONS: Record<string, CouponRule> = {
  OSS10: { percent: 10, activeByDefault: true, maxUsesPerCustomer: 5 },
};

export function getCouponRule(code: unknown): { code: string; rule: CouponRule } | null {
  if (typeof code !== 'string') return null;
  const upper = code.trim().toUpperCase();
  const rule = COUPONS[upper];
  return rule ? { code: upper, rule } : null;
}
