import productsData from '@/data/products.json';
import { CartItem } from '@/types';

interface ProductEntry {
  id: string;
  basePrice: number;
  customPrice: number;
  inStock: boolean;
}

// Build a flat lookup map from products.json at module load time
const productMap = new Map<string, ProductEntry>();
for (const product of [...productsData.belts, ...productsData.patches]) {
  productMap.set(product.id, {
    id: product.id,
    basePrice: product.basePrice,
    customPrice: product.customPrice,
    inStock: product.inStock,
  });
}

export interface PriceVerificationResult {
  ok: boolean;
  serverSubtotal: number;
  error?: string;
}

/**
 * Re-derives the order subtotal entirely from server-side product data.
 * Returns an error if any item references an unknown product, is out of
 * stock, or has an invalid quantity.
 */
export function verifyAndCalculateSubtotal(items: CartItem[]): PriceVerificationResult {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, serverSubtotal: 0, error: 'Carrinho vazio' };
  }

  let serverSubtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      return {
        ok: false,
        serverSubtotal: 0,
        error: `Produto não encontrado: ${item.productId}`,
      };
    }

    if (!product.inStock) {
      return {
        ok: false,
        serverSubtotal: 0,
        error: `Produto fora de estoque: ${item.productId}`,
      };
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return {
        ok: false,
        serverSubtotal: 0,
        error: `Quantidade inválida para: ${item.productId}`,
      };
    }

    // Determine price based on customization type — never trust item.price
    const isCustom =
      item.customization?.type === 'custom' || item.customization?.type === 'team';
    const unitPrice = isCustom ? product.customPrice : product.basePrice;

    serverSubtotal += unitPrice * quantity;
  }

  return { ok: true, serverSubtotal: Math.round(serverSubtotal * 100) / 100 };
}
