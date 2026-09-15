import productsData from '@/data/products.json';
import { CartItem } from '@/types';

interface ProductEntry {
  id: string;
  basePrice: number;
  customPrice: number;
  basePriceUSD: number;
  customPriceUSD: number;
  inStock: boolean;
}

// Build a flat lookup map from products.json at module load time
const productMap = new Map<string, ProductEntry>();
for (const product of [...productsData.belts, ...productsData.patches]) {
  const p = product as typeof product & { basePriceUSD?: number; customPriceUSD?: number };
  productMap.set(product.id, {
    id: product.id,
    basePrice: product.basePrice,
    customPrice: product.customPrice,
    // Preço internacional fixo definido no catálogo. Cai para 0 se ausente —
    // o chamador (PayPal) trata subtotal 0 como erro, evitando venda a US$0.
    basePriceUSD: p.basePriceUSD ?? 0,
    customPriceUSD: p.customPriceUSD ?? 0,
    inStock: product.inStock,
  });
}

export interface PriceVerificationResult {
  ok: boolean;
  serverSubtotal: number;
  /** Subtotal em USD, derivado dos preços internacionais fixos do catálogo. */
  serverSubtotalUSD: number;
  error?: string;
}

/**
 * Re-derives the order subtotal entirely from server-side product data.
 * Returns an error if any item references an unknown product, is out of
 * stock, or has an invalid quantity.
 */
export function verifyAndCalculateSubtotal(items: CartItem[]): PriceVerificationResult {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, serverSubtotal: 0, serverSubtotalUSD: 0, error: 'Carrinho vazio' };
  }

  let serverSubtotal = 0;
  let serverSubtotalUSD = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      return {
        ok: false,
        serverSubtotal: 0,
        serverSubtotalUSD: 0,
        error: `Produto não encontrado: ${item.productId}`,
      };
    }

    if (!product.inStock) {
      return {
        ok: false,
        serverSubtotal: 0,
        serverSubtotalUSD: 0,
        error: `Produto fora de estoque: ${item.productId}`,
      };
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return {
        ok: false,
        serverSubtotal: 0,
        serverSubtotalUSD: 0,
        error: `Quantidade inválida para: ${item.productId}`,
      };
    }

    // Determine price based on customization type — never trust item.price
    const isCustom =
      item.customization?.type === 'custom' || item.customization?.type === 'team';
    const unitPrice = isCustom ? product.customPrice : product.basePrice;
    const unitPriceUSD = isCustom ? product.customPriceUSD : product.basePriceUSD;

    serverSubtotal += unitPrice * quantity;
    serverSubtotalUSD += unitPriceUSD * quantity;
  }

  return {
    ok: true,
    serverSubtotal: Math.round(serverSubtotal * 100) / 100,
    serverSubtotalUSD: Math.round(serverSubtotalUSD * 100) / 100,
  };
}
