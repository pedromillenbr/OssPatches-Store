/**
 * Pixel da Meta (navegador) + espelho para a API de Conversões (servidor).
 *
 * Por que os dois caminhos ao mesmo tempo: bloqueador de anúncio, iOS e o fim
 * do cookie de terceiros derrubam uma parte grande dos eventos do Pixel. O que
 * o navegador não consegue mandar, o servidor manda. Para a Meta não contar a
 * mesma ação duas vezes, os dois lados enviam o MESMO `eventId` — é assim que
 * a deduplicação dela funciona.
 *
 * Purchase é a exceção: ele NÃO passa por aqui rumo ao servidor. Quem dispara
 * o Purchase do lado do servidor é o webhook do Mercado Pago, no instante em
 * que o pagamento é aprovado de verdade (ver `lib/metaCapi.ts`). Assim ninguém
 * consegue forjar venda chamando a nossa rota, e só conta o que virou dinheiro.
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Eventos que o navegador pode espelhar no servidor. Purchase fica de fora. */
const MIRRORED = new Set([
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Contact',
]);

/** Id único do evento — a chave que liga o envio do navegador ao do servidor. */
export function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Dispara um evento no Pixel e, quando faz sentido, repete no servidor.
 * Nunca lança: rastreamento não pode derrubar carrinho nem checkout.
 */
export function metaTrack(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId: string = newEventId(),
): void {
  if (!META_PIXEL_ID || typeof window === 'undefined') return;

  try {
    window.fbq?.('track', eventName, params, { eventID: eventId });
  } catch {
    /* ignora */
  }

  if (!MIRRORED.has(eventName)) return;

  try {
    // keepalive para o envio sobreviver à troca de página (ex.: clique em
    // "Finalizar compra" leva embora antes do fetch terminar).
    void fetch('/api/meta/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        custom: params,
      }),
    }).catch(() => undefined);
  } catch {
    /* ignora */
  }
}

/** PageView. O código base do Pixel já dispara o primeiro; este cobre a troca de rota. */
export function metaPageView(): void {
  if (!META_PIXEL_ID || typeof window === 'undefined') return;
  try {
    window.fbq?.('track', 'PageView');
  } catch {
    /* ignora */
  }
}
