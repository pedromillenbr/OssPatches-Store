import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { getCouponRule, type CouponRule } from '@/config/coupons';

/**
 * Contagem de uso dos cupons e chave liga/desliga.
 *
 * Fica no Redis (Upstash) porque:
 *  - é o único lugar que já temos no servidor que persiste entre requisições
 *    (o Supabase só guarda pedidos de quem tem conta; convidado não entra lá);
 *  - INCR é atômico, então dois checkouts ao mesmo tempo não se atropelam.
 *
 * LGPD: nunca gravamos o e-mail do cliente. Guardamos um hash irreversível,
 * que serve para contar sem identificar ninguém.
 *
 * Se o Redis estiver fora do ar, tudo falha PARA O LADO DO CLIENTE (cupom
 * continua valendo). Travar a venda porque o contador caiu seria pior para a
 * loja do que deixar passar um desconto a mais.
 */

function buildRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = buildRedis();

/** Identificador estável e anônimo do cliente, derivado do e-mail. */
function customerKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}

const activeKey = (code: string) => `coupon:active:${code}`;
const usesKey = (code: string, email: string) => `coupon:uses:${code}:${customerKey(email)}`;
const pendingKey = (orderId: string) => `coupon:pending:${orderId}`;

// ---------------------------------------------------------------------------
// Liga / desliga
// ---------------------------------------------------------------------------

export async function isCouponActive(code: string, rule: CouponRule): Promise<boolean> {
  if (!redis) return rule.activeByDefault;
  try {
    const stored = await redis.get<string | number>(activeKey(code));
    if (stored === null || stored === undefined) return rule.activeByDefault;
    return String(stored) === '1';
  } catch (err) {
    console.error('[coupon] falha ao ler estado, usando o padrão:', err);
    return rule.activeByDefault;
  }
}

export async function setCouponActive(code: string, active: boolean): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.set(activeKey(code), active ? '1' : '0');
    return true;
  } catch (err) {
    console.error('[coupon] falha ao gravar estado:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Contagem de uso por cliente
// ---------------------------------------------------------------------------

export async function getUsesForCustomer(code: string, email: string): Promise<number> {
  if (!redis || !email) return 0;
  try {
    const value = await redis.get<string | number>(usesKey(code, email));
    return Number(value) || 0;
  } catch (err) {
    console.error('[coupon] falha ao contar usos:', err);
    return 0; // falha para o lado do cliente
  }
}

/** Soma +1 no contador do cliente. Chamado só quando a compra foi PAGA. */
export async function registerUse(code: string, email: string): Promise<void> {
  if (!redis || !email) return;
  try {
    await redis.incr(usesKey(code, email));
  } catch (err) {
    console.error('[coupon] falha ao registrar uso:', err);
  }
}

// ---------------------------------------------------------------------------
// Pix: o pedido nasce antes do pagamento
// ---------------------------------------------------------------------------

/**
 * Guarda "este pedido Pix usou o cupom X para o cliente Y". Só quando o
 * Mercado Pago avisar que o Pix foi pago é que o uso é contabilizado — assim
 * um Pix gerado e não pago não queima uma das 5 compras do cliente.
 */
export async function holdPixUse(orderId: string, code: string, email: string): Promise<void> {
  if (!redis || !email) return;
  try {
    await redis.set(
      pendingKey(orderId),
      JSON.stringify({ code, customer: customerKey(email) }),
      { ex: 60 * 60 * 24 * 3 } // 3 dias: muito além da validade de um Pix
    );
  } catch (err) {
    console.error('[coupon] falha ao reservar uso do Pix:', err);
  }
}

/**
 * Converte a reserva do Pix em uso de verdade. Apaga a reserva antes de
 * contar, então o webhook do Mercado Pago pode chegar várias vezes (ele
 * reenvia) sem contar o mesmo pedido duas vezes.
 */
export async function settlePixUse(orderId: string): Promise<void> {
  if (!redis) return;
  try {
    const raw = await redis.get<string | Record<string, string>>(pendingKey(orderId));
    if (!raw) return;

    const removed = await redis.del(pendingKey(orderId));
    if (!removed) return; // outra entrega do webhook chegou primeiro

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data?.code || !data?.customer) return;

    await redis.incr(`coupon:uses:${data.code}:${data.customer}`);
  } catch (err) {
    console.error('[coupon] falha ao confirmar uso do Pix:', err);
  }
}

// ---------------------------------------------------------------------------
// Checagem usada pelo checkout
// ---------------------------------------------------------------------------

export interface CouponCheck {
  code: string | null;
  percent: number;
  /** Mensagem para mostrar ao cliente quando o cupom foi recusado. */
  error?: string;
  /** Quantas compras ainda restam para este cliente (null = ilimitado). */
  remaining?: number | null;
}

const NO_COUPON: CouponCheck = { code: null, percent: 0 };

/**
 * Confere o cupom inteiro: existe, está ligado e o cliente ainda tem saldo.
 * `email` é opcional porque no carrinho o cliente ainda não digitou o e-mail;
 * nesse momento só dá para conferir existência e se está ligado.
 */
export async function checkCoupon(rawCode: unknown, email?: string): Promise<CouponCheck> {
  const found = getCouponRule(rawCode);
  if (!found) {
    return rawCode ? { ...NO_COUPON, error: 'Cupom inválido ou expirado' } : NO_COUPON;
  }

  const { code, rule } = found;

  if (!(await isCouponActive(code, rule))) {
    return { ...NO_COUPON, error: 'Este cupom não está mais disponível' };
  }

  if (!rule.maxUsesPerCustomer) {
    return { code, percent: rule.percent, remaining: null };
  }

  if (!email) {
    return { code, percent: rule.percent };
  }

  const used = await getUsesForCustomer(code, email);
  const remaining = rule.maxUsesPerCustomer - used;

  if (remaining <= 0) {
    return {
      ...NO_COUPON,
      error: `Você já usou o cupom ${code} nas ${rule.maxUsesPerCustomer} compras permitidas`,
    };
  }

  return { code, percent: rule.percent, remaining };
}
