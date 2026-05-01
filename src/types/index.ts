// ─── Product Types ────────────────────────────────────────────────────────────

export type BeltSize = 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
export type KidsBeltSize = 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
export type PatchSize = 'P' | 'M' | 'G';
export type PatchFormat = 'redondo' | 'retangular';
export type BeltDegree = 0 | 1 | 2 | 3 | 4;
export type ProductCategory = 'belt-adult' | 'belt-kids' | 'patch';

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: ProductCategory;
  color: string;
  colorHex: string;
  colorHexSecondary?: string;
  basePrice: number;
  customPrice: number;
  description: string;
  features: string[];
  sizes: BeltSize[] | KidsBeltSize[];
  hasDegrees: boolean;
  hasStripe?: boolean; // Para faixas infantis
  images: string[];
  inStock: boolean;
  metaTitle: string;
  metaDescription: string;
  badge?: string;
}

export interface PatchProduct {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: 'patch';
  basePrice: number;
  customPrice: number;
  description: string;
  features: string[];
  sizes: PatchSize[];
  formats: PatchFormat[];
  images: string[];
  inStock: boolean;
  minQuantity: number;
  metaTitle: string;
  metaDescription: string;
}

// ─── Cart Types ────────────────────────────────────────────────────────────────

export interface BeltCustomization {
  type: 'standard' | 'custom';
  size: BeltSize | KidsBeltSize;
  degree: BeltDegree;
  embroideredName?: string;
  stripe?: 'none' | 'white' | 'black'; // Para faixas infantis
}

export interface PatchCustomization {
  type: 'standard' | 'custom' | 'team';
  size: PatchSize;
  format: PatchFormat;
  quantity: number;
  artworkUrl?: string;
  artworkFileName?: string;
}

export type ItemCustomization = BeltCustomization | PatchCustomization;

export interface CartItem {
  cartId: string;
  productId: string;
  slug: string;
  name: string;
  category: ProductCategory | 'patch';
  price: number;
  quantity: number;
  customization: ItemCustomization;
  image: string;
}

// ─── Shipping Types ───────────────────────────────────────────────────────────

export interface ShippingOption {
  id: string;
  name: string;
  company: string;
  price: number;
  days: string;
  logo?: string;
}

export interface Address {
  cep?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  zipCode: string;
}

// ─── Checkout Types ───────────────────────────────────────────────────────────

export type CheckoutStep = 'identification' | 'address' | 'shipping' | 'payment' | 'success';

export interface CustomerIdentification {
  name: string;
  email: string;
  cpf?: string;       // Brazil only
  phone?: string;     // International
  country: string;
  countryCode: string;
}

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'paypal';

export interface OrderPayment {
  method: PaymentMethod;
  installments?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerIdentification;
  address: Address;
  shipping: ShippingOption | null;
  payment: OrderPayment;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  notes?: string;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

export interface MelhorEnvioQuoteRequest {
  from: { postal_code: string };
  to: { postal_code: string };
  products: { weight: number; width: number; height: number; length: number; quantity: number }[];
}
