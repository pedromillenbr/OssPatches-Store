export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// Push event to dataLayer
function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

export function pageview(url: string) {
  if (!GA_ID) return;
  gtag('config', GA_ID, { page_path: url });
}

// ─── Ecommerce Events ─────────────────────────────────────────────────────────

export function trackViewProduct(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  if (!GA_ID) return;
  gtag('event', 'view_item', {
    currency: 'BRL',
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price }],
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}) {
  if (!GA_ID) return;
  gtag('event', 'add_to_cart', {
    currency: 'BRL',
    value: item.price * item.quantity,
    items: [{ item_id: item.id, item_name: item.name, item_category: item.category, price: item.price, quantity: item.quantity }],
  });
}

export function trackBeginCheckout(value: number, itemCount: number) {
  if (!GA_ID) return;
  gtag('event', 'begin_checkout', { currency: 'BRL', value, num_items: itemCount });
}

export function trackCheckoutStep(step: string) {
  if (!GA_ID) return;
  gtag('event', 'checkout_progress', { checkout_step: step });
}

export function trackSelectShipping(shippingName: string, price: number) {
  if (!GA_ID) return;
  gtag('event', 'add_shipping_info', { currency: 'BRL', shipping_tier: shippingName, value: price });
}

export function trackSelectPayment(method: string) {
  if (!GA_ID) return;
  gtag('event', 'add_payment_info', { payment_type: method });
}

export function trackPurchase(order: {
  id: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  currency: string;
  couponCode?: string;
  items: { productId: string; name: string; category: string; price: number; quantity: number }[];
}) {
  if (!GA_ID) return;
  gtag('event', 'purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: order.currency,
    shipping: order.shippingCost,
    coupon: order.couponCode || '',
    items: order.items.map((i) => ({
      item_id: i.productId,
      item_name: i.name,
      item_category: i.category,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

export function trackCouponApplied(code: string, discountPercent: number) {
  if (!GA_ID) return;
  gtag('event', 'coupon_applied', { coupon_code: code, discount_percent: discountPercent });
}

export function trackWhatsAppClick() {
  if (!GA_ID) return;
  gtag('event', 'whatsapp_click', { event_category: 'engagement' });
}
