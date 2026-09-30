import type { NextApiRequest, NextApiResponse } from 'next';
import { rejectIfRateLimited, getClientIp } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';
import { sendMetaEvent, isMetaCapiConfigured } from '@/lib/metaCapi';

/**
 * Espelha no servidor os eventos de navegação que o Pixel dispara no cliente.
 *
 * Existe porque bloqueador de anúncio e iOS derrubam boa parte do Pixel. O
 * navegador manda o evento com um `eventId`; esta rota repete o mesmo evento,
 * com o mesmo id, direto para a Meta — que descarta a cópia. Ver `metaPixel.ts`.
 *
 * Purchase NÃO entra aqui de propósito. A rota é pública: se aceitasse venda
 * vinda do navegador, qualquer pessoa poderia inventar faturamento e envenenar
 * a otimização das campanhas. Quem dispara Purchase é o webhook do Mercado
 * Pago, quando o dinheiro é confirmado.
 *
 * Responde 204 sempre que o formato está ok, mesmo se o envio falhar: é
 * bastidor e não pode atrapalhar a navegação de ninguém.
 */

const ALLOWED_EVENTS = new Set([
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Contact',
]);

/** Só deixa passar os campos que a Meta entende, com tipo garantido. */
function normalizeCustom(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (typeof src.currency === 'string') out.currency = src.currency.slice(0, 8);
  if (Number.isFinite(Number(src.value))) out.value = Number(src.value);
  if (typeof src.content_type === 'string') out.content_type = src.content_type.slice(0, 32);
  if (typeof src.content_name === 'string') out.content_name = src.content_name.slice(0, 200);
  if (typeof src.content_category === 'string') out.content_category = src.content_category.slice(0, 100);
  if (Number.isFinite(Number(src.num_items))) out.num_items = Number(src.num_items);

  if (Array.isArray(src.content_ids)) {
    out.content_ids = src.content_ids.slice(0, 50).map((id) => String(id).slice(0, 100));
  }

  if (Array.isArray(src.contents)) {
    out.contents = src.contents.slice(0, 50).map((entry) => {
      const item = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
      return {
        id: String(item.id ?? '').slice(0, 100),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        item_price: Number(item.item_price) || 0,
      };
    });
  }

  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Sem Pixel/token configurado a rota não faz nada — mas responde ok para o
  // navegador não ficar tentando de novo.
  if (!isMetaCapiConfigured()) return res.status(204).end();

  if (await rejectIfRateLimited('meta-capi', req, res)) return;

  if (isBodyTooLarge(req, 32 * 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const eventName = String(req.body?.eventName ?? '');
  if (!ALLOWED_EVENTS.has(eventName)) {
    return res.status(400).json({ error: 'Evento não permitido' });
  }

  const eventId = String(req.body?.eventId ?? '').slice(0, 100);
  if (!eventId) {
    return res.status(400).json({ error: 'eventId obrigatório' });
  }

  // _fbp e _fbc são os cookies que o próprio Pixel grava no navegador. São o
  // que mais aumenta a taxa de casamento do evento, e chegam aqui de graça.
  const cookies = req.cookies || {};

  await sendMetaEvent({
    eventName,
    eventId,
    eventSourceUrl:
      typeof req.body?.eventSourceUrl === 'string'
        ? req.body.eventSourceUrl.slice(0, 500)
        : undefined,
    user: {
      clientIp: getClientIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
      fbp: cookies._fbp,
      fbc: cookies._fbc,
    },
    custom: normalizeCustom(req.body?.custom),
  });

  return res.status(204).end();
}
