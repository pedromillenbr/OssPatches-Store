/**
 * Funil de vendas — lado do navegador.
 *
 * Anota até onde o visitante chegou (ver supabase/checkout_events.sql). O
 * visitante é só um código aleatório guardado no aparelho: nada de nome, e-mail
 * ou IP. Tudo silencioso — nada aqui pode travar ou atrasar a compra.
 */

export const FUNNEL_STEPS = ['produto', 'carrinho', 'checkout', 'dados', 'endereco', 'frete', 'pagamento'] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

const VISITOR_KEY = 'oss-vid';
const SENT_KEY = 'oss-funnel-sent';

/** Código aleatório do visitante. Vazio quando o navegador bloqueia o armazenamento. */
export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[a-z0-9]{20,40}$/.test(id)) {
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      id = Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('');
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

/** Registra que o visitante chegou a esta etapa (uma vez por dia basta). */
export function trackFunnel(step: FunnelStep): void {
  if (typeof window === 'undefined') return;
  try {
    const visitorId = getVisitorId();
    if (!visitorId) return;

    // O servidor já ignora repetição; isto só evita chamadas à toa.
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const sentKey = `${SENT_KEY}:${today}:${step}`;
    if (sessionStorage.getItem(sentKey)) return;
    sessionStorage.setItem(sentKey, '1');

    const body = JSON.stringify({ visitorId, step });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/funnel', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/funnel', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* bastidor — nunca pode atrapalhar o cliente */
  }
}
