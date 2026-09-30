import { metaTrack, metaPageView, META_PIXEL_ID } from '@/lib/metaPixel';

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export { META_PIXEL_ID };

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
  if (GA_ID) gtag('config', GA_ID, { page_path: url });
  metaPageView();
}

// ─── Ecommerce Events ─────────────────────────────────────────────────────────
//
// Cada função alimenta os dois destinos: GA4 (medição) e Pixel da Meta
// (otimização de anúncio). Os dois guards são separados de propósito — se um
// dos IDs não estiver configurado, o outro continua funcionando.

export function trackViewProduct(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  if (GA_ID) {
    gtag('event', 'view_item', {
      currency: 'BRL',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price }],
    });
  }

  metaTrack('ViewContent', {
    currency: 'BRL',
    value: product.price,
    content_type: 'product',
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}) {
  if (GA_ID) {
    gtag('event', 'add_to_cart', {
      currency: 'BRL',
      value: item.price * item.quantity,
      items: [{ item_id: item.id, item_name: item.name, item_category: item.category, price: item.price, quantity: item.quantity }],
    });
  }

  metaTrack('AddToCart', {
    currency: 'BRL',
    value: item.price * item.quantity,
    content_type: 'product',
    content_ids: [item.id],
    content_name: item.name,
    content_category: item.category,
    contents: [{ id: item.id, quantity: item.quantity, item_price: item.price }],
  });
}

export function trackBeginCheckout(value: number, itemCount: number) {
  if (GA_ID) gtag('event', 'begin_checkout', { currency: 'BRL', value, num_items: itemCount });

  metaTrack('InitiateCheckout', { currency: 'BRL', value, num_items: itemCount });
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
  if (GA_ID) gtag('event', 'add_payment_info', { payment_type: method });

  metaTrack('AddPaymentInfo', { payment_type: method });
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
  if (GA_ID) {
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

  // O id do evento é o número do pedido — o MESMO que o webhook do Mercado
  // Pago usa ao mandar o Purchase pelo servidor. É isso que impede a Meta de
  // contar a venda duas vezes (ver `lib/metaCapi.ts`).
  metaTrack(
    'Purchase',
    {
      currency: order.currency,
      value: order.total,
      content_type: 'product',
      content_ids: order.items.map((i) => i.productId),
      contents: order.items.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.price })),
      num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
      order_id: order.id,
    },
    order.id,
  );
}

export function trackCouponApplied(code: string, discountPercent: number) {
  if (!GA_ID) return;
  gtag('event', 'coupon_applied', { coupon_code: code, discount_percent: discountPercent });
}

export function trackWhatsAppClick() {
  if (GA_ID) gtag('event', 'whatsapp_click', { event_category: 'engagement' });

  metaTrack('Contact', { method: 'whatsapp' });
}
