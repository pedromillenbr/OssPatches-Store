import productsData from '@/data/products.json';
import { CartItem, ItemCustomization } from '@/types';
import { isArtworkPath } from '@/lib/artwork';

interface ProductEntry {
  id: string;
  slug: string;
  name: string;
  category: CartItem['category'];
  image: string;
  basePrice: number;
  customPrice: number;
  basePriceUSD: number;
  customPriceUSD: number;
  inStock: boolean;
  hidden: boolean;
}

// Build a flat lookup map from products.json at module load time
const productMap = new Map<string, ProductEntry>();
for (const product of [...productsData.belts, ...productsData.patches]) {
  const p = product as typeof product & { basePriceUSD?: number; customPriceUSD?: number; images?: string[]; hidden?: boolean };
  productMap.set(product.id, {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category as CartItem['category'],
    image: p.images?.[0] ?? '',
    basePrice: product.basePrice,
    customPrice: product.customPrice,
    // Preço internacional fixo definido no catálogo. Cai para 0 se ausente —
    // o chamador (PayPal) trata subtotal 0 como erro, evitando venda a US$0.
    basePriceUSD: p.basePriceUSD ?? 0,
    customPriceUSD: p.customPriceUSD ?? 0,
    inStock: product.inStock,
    hidden: p.hidden === true,
  });
}

export interface PriceVerificationResult {
  ok: boolean;
  serverSubtotal: number;
  /** Subtotal em USD, derivado dos preços internacionais fixos do catálogo. */
  serverSubtotalUSD: number;
  /**
   * Itens reconstruídos a partir do catálogo: nome, categoria e preço vêm do
   * servidor. É isto que deve ir para planilha e e-mail — nunca os itens
   * crus do cliente (que poderiam trazer nome/preço falsos).
   */
  items: CartItem[];
  error?: string;
}

const MAX_TEXT = 80;

function cleanText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_TEXT);
  return v || undefined;
}

/**
 * Campos de um patch (ou de uma faixa) que a produção precisa: tamanho,
 * formato, medidas e a arte enviada. `artworkPath` só passa se for um
 * caminho gerado pelo nosso servidor (ver lib/artwork).
 */
function cleanPatchFields(c: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ['size', 'format', 'stripe', 'embroideredName', 'artworkFileName', 'dimensions'] as const) {
    const v = cleanText(c[key]);
    if (v) out[key] = v;
  }
  if (isArtworkPath(c.artworkPath)) out.artworkPath = c.artworkPath;
  for (const key of ['heightCm', 'widthCm', 'sideCm', 'diameterCm'] as const) {
    const n = Number(c[key]);
    if (c[key] !== undefined && c[key] !== null && Number.isFinite(n) && n > 0 && n <= 100) out[key] = n;
  }
  return out;
}

/**
 * Mantém só os campos de personalização conhecidos, com texto limitado.
 * Campos extras enviados pelo cliente são descartados.
 */
function cleanCustomization(raw: unknown): ItemCustomization {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const type = c.type === 'custom' || c.type === 'team' ? c.type : 'standard';
  const out: Record<string, unknown> = { type };
  Object.assign(out, cleanPatchFields(c));
  if (typeof c.artworkUrl === 'string' && /^https:\/\//.test(c.artworkUrl)) {
    out.artworkUrl = c.artworkUrl.slice(0, 500);
  }
  // Kit de patches: cada patch tem tamanho, formato, medidas e arte próprios.
  // O preço não muda (o kit é cobrado como item padrão), mas sem isto a
  // produção recebia o kit sem saber o que fazer.
  if (Array.isArray(c.items)) {
    out.items = c.items.slice(0, 10).map((raw) =>
      cleanPatchFields((raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>)
    );
  }
  if (c.degree !== undefined) {
    const d = Number(c.degree);
    out.degree = Number.isInteger(d) && d >= 0 && d <= 10 ? d : 0;
  }
  if (c.quantity !== undefined) {
    const q = Number(c.quantity);
    if (Number.isInteger(q) && q > 0 && q <= 10000) out.quantity = q;
  }
  return out as unknown as ItemCustomization;
}

function fail(error: string): PriceVerificationResult {
  return { ok: false, serverSubtotal: 0, serverSubtotalUSD: 0, items: [], error };
}

/**
 * Re-derives the order subtotal entirely from server-side product data.
 * Returns an error if any item references an unknown product, is out of
 * stock, or has an invalid quantity.
 */
export function verifyAndCalculateSubtotal(items: CartItem[]): PriceVerificationResult {
  if (!Array.isArray(items) || items.length === 0) return fail('Carrinho vazio');
  if (items.length > 50) return fail('Carrinho com itens demais');

  let serverSubtotal = 0;
  let serverSubtotalUSD = 0;
  const normalized: CartItem[] = [];

  for (const item of items) {
    const product = productMap.get(String(item?.productId ?? ''));
    if (!product) return fail('Produto não encontrado no catálogo');
    // Produto escondido não pode ser comprado nem por chamada direta à API
    if (product.hidden) return fail('Produto indisponível no momento');
    if (!product.inStock) return fail(`Produto fora de estoque: ${product.name}`);

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return fail(`Quantidade inválida para: ${product.name}`);
    }

    const customization = cleanCustomization(item.customization);
    // Determine price based on customization type — never trust item.price
    const isCustom = customization.type === 'custom' || customization.type === 'team';
    const unitPrice = isCustom ? product.customPrice : product.basePrice;
    const unitPriceUSD = isCustom ? product.customPriceUSD : product.basePriceUSD;

    serverSubtotal += unitPrice * quantity;
    serverSubtotalUSD += unitPriceUSD * quantity;

    normalized.push({
      cartId: cleanText(item.cartId) ?? product.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: unitPrice,
      quantity,
      customization,
      image: product.image,
    });
  }

  return {
    ok: true,
    serverSubtotal: Math.round(serverSubtotal * 100) / 100,
    serverSubtotalUSD: Math.round(serverSubtotalUSD * 100) / 100,
    items: normalized,
  };
}
