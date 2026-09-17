import type { CartItem } from '@/types';
import { verifyAndCalculateSubtotal } from '@/lib/priceVerifier';

export type PayPalTotals =
  | {
      ok: true;
      items: CartItem[];
      subtotalBRL: number;
      discountAmountBRL: number;
      totalBRL: number;
      totalUSD: number;
    }
  | { ok: false; status: number; error: string };

/**
 * Total de um pedido internacional (PayPal), calculado só com dados do
 * servidor. Usado na criação E na captura, para garantir que o valor pago
 * corresponde aos itens registrados. Frete internacional é cobrado à parte.
 */
export function computePayPalTotals(items: unknown, discountPercent: number): PayPalTotals {
  const price = verifyAndCalculateSubtotal(items as CartItem[]);
  if (!price.ok) return { ok: false, status: 400, error: price.error || 'Carrinho inválido' };

  // O preço internacional vem de valores fixos em USD no catálogo (não de câmbio).
  // Se algum produto não tiver preço USD, o subtotal fica 0 — recusamos a venda
  // em vez de cobrar US$0.
  if (!price.serverSubtotalUSD || price.serverSubtotalUSD <= 0) {
    return { ok: false, status: 422, error: 'Produto sem preço internacional disponível.' };
  }

  const discountAmountBRL = Math.round(price.serverSubtotal * discountPercent) / 100;
  const discountAmountUSD = Math.round(price.serverSubtotalUSD * discountPercent) / 100;

  return {
    ok: true,
    items: price.items,
    subtotalBRL: price.serverSubtotal,
    discountAmountBRL,
    totalBRL: Math.round((price.serverSubtotal - discountAmountBRL) * 100) / 100,
    totalUSD: Math.round((price.serverSubtotalUSD - discountAmountUSD) * 100) / 100,
  };
}
