import productsData from '@/data/products.json';
import { Product, PatchProduct } from '@/types';

const allBelts = productsData.belts as Product[];
const allPatches = productsData.patches as PatchProduct[];

export function getAllProducts(): (Product | PatchProduct)[] {
  return [...allBelts, ...allPatches];
}

export function getAllBelts(): Product[] {
  return allBelts;
}

export function getAdultBelts(): Product[] {
  return allBelts.filter((b) => b.category === 'belt-adult');
}

export function getKidsBelts(): Product[] {
  return allBelts.filter((b) => b.category === 'belt-kids');
}

export function getAllPatches(): PatchProduct[] {
  return allPatches;
}

export function getProductBySlug(slug: string): Product | PatchProduct | null {
  const belt = allBelts.find((b) => b.slug === slug);
  if (belt) return belt;
  const patch = allPatches.find((p) => p.slug === slug);
  return patch || null;
}

export function getAllSlugs(): string[] {
  return [...allBelts.map((b) => b.slug), ...allPatches.map((p) => p.slug)];
}

export function formatPrice(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
