/**
 * API de Conversões da Meta (lado servidor).
 *
 * O Pixel sozinho perde eventos: bloqueador de anúncio, iOS e o fim do cookie
 * de terceiros comem uma fatia grande. O que o navegador não entrega, esta
 * rota entrega direto de servidor para servidor. Os dois lados mandam o mesmo
 * `event_id` e a Meta descarta a cópia — ver `lib/metaPixel.ts`.
 *
 * Nada aqui pode derrubar pedido: toda função engole o próprio erro e só loga.
 * Sem `META_CAPI_TOKEN` configurado, vira no-op silencioso.
 *
 * LGPD: o que sai daqui vai SEMPRE com hash SHA-256 (é o formato que a Meta
 * exige). CPF não é enviado de propósito — e-mail, telefone, nome e cidade já
 * dão casamento suficiente, e documento é dado sensível demais para mandar a
 * terceiro sem necessidade.
 */
import crypto from 'crypto';
import type { Order } from '@/types';
import { CONFIG } from '@/config';

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const CAPI_TOKEN = process.env.META_CAPI_TOKEN || '';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
// Preenchido só enquanto se testa no "Testar eventos" do Gerenciador. Em
// produção fica vazio, senão os eventos entram como teste e não otimizam nada.
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

export function isMetaCapiConfigured(): boolean {
  return Boolean(META_PIXEL_ID && CAPI_TOKEN);
}

// ─── Normalização + hash ──────────────────────────────────────────────────────
// A Meta só casa o dado se ele chegar no formato exato dela: minúsculo, sem
// espaço, sem pontuação. Hash de texto "sujo" simplesmente não bate com nada.

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashText(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  return clean ? sha256(clean) : undefined;
}

/** Nome/cidade: minúsculo e sem acento, pontuação ou espaço. */
function hashName(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return clean ? sha256(clean) : undefined;
}

/** Telefone: só dígitos, com código do país e sem o "+". */
function hashPhone(value?: string | null, countryCode?: string): string | undefined {
  if (!value) return undefined;
  let digits = value.replace(/\D/g, '');
  if (!digits) return undefined;
  // Número brasileiro digitado sem o 55 na frente não casa com nada lá.
  if (digits.length <= 11 && (countryCode || 'BR').toUpperCase() === 'BR') {
    digits = `55${digits}`;
  }
  return sha256(digits);
}

/** CEP: só dígitos. */
function hashZip(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  return digits ? sha256(digits) : undefined;
}

export type MetaUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  /** Não sofrem hash — a Meta exige em texto puro. */
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
};

function buildUserData(user: MetaUserData): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const em = hashText(user.email);
  if (em) out.em = [em];

  const ph = hashPhone(user.phone, user.country);
  if (ph) out.ph = [ph];

  const fn = hashName(user.firstName);
  if (fn) out.fn = [fn];

  const ln = hashName(user.lastName);
  if (ln) out.ln = [ln];

  const ct = hashName(user.city);
  if (ct) out.ct = [ct];

  const st = hashName(user.state);
  if (st) out.st = [st];

  const zp = hashZip(user.zip);
  if (zp) out.zp = [zp];

  const country = hashText(user.country);
  if (country) out.country = [country];

  // Estes três vão crus, por definição da Meta.
  if (user.clientIp) out.client_ip_address = user.clientIp;
  if (user.userAgent) out.client_user_agent = user.userAgent;
  if (user.fbp) out.fbp = user.fbp;
  if (user.fbc) out.fbc = user.fbc;

  return out;
}

// ─── Envio ────────────────────────────────────────────────────────────────────

export async function sendMetaEvent(params: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  eventTime?: number;
  user: MetaUserData;
  custom?: Record<string, unknown>;
}): Promise<void> {
  if (!isMetaCapiConfigured()) return;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: params.eventName,
        event_time: params.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: 'website',
        event_source_url: params.eventSourceUrl || CONFIG.siteUrl,
        user_data: buildUserData(params.user),
        custom_data: params.custom ?? {},
      },
    ],
  };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // A Meta é rápida, mas não podemos deixar o webhook do MP pendurado.
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[metaCapi] ${params.eventName} recusado (${res.status}): ${detail.slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`[metaCapi] Falha ao enviar ${params.eventName}:`, err);
  }
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

/**
 * Manda o Purchase a partir do pedido pago.
 *
 * `event_id` é o número do pedido — o mesmo que o Pixel usa no navegador. Isso
 * faz a deduplicação funcionar e garante que uma reentrega do webhook não
 * conte a venda de novo.
 */
export async function sendPurchaseToMeta(order: Order): Promise<void> {
  if (!isMetaCapiConfigured()) return;

  const [firstName, ...rest] = (order.customer?.name || '').trim().split(/\s+/);

  await sendMetaEvent({
    eventName: 'Purchase',
    eventId: order.id,
    eventSourceUrl: `${CONFIG.siteUrl}/pedido/${order.id}`,
    user: {
      email: order.customer?.email,
      phone: order.customer?.phone,
      firstName,
      lastName: rest.join(' ') || undefined,
      city: order.address?.city,
      state: order.address?.state,
      zip: order.address?.zipCode || order.address?.cep,
      country: order.address?.countryCode || order.customer?.countryCode,
    },
    custom: {
      currency: order.currency || 'BRL',
      value: order.total,
      content_type: 'product',
      content_ids: (order.items || []).map((i) => i.productId),
      contents: (order.items || []).map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.price,
      })),
      num_items: (order.items || []).reduce((sum, i) => sum + i.quantity, 0),
      order_id: order.id,
    },
  });
}
