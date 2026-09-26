import type { NextApiRequest, NextApiResponse } from 'next';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// IP extraction. O site roda na Vercel SEM Cloudflare na frente, então headers
// como cf-connecting-ip podem ser forjados pelo próprio cliente (cada request
// com um IP inventado = limite nunca atingido). Usamos os headers que a
// própria Vercel define e sobrescreve na borda.
// ---------------------------------------------------------------------------
function firstHeader(req: NextApiRequest, name: string): string | null {
  const value = req.headers[name];
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || !raw) return null;
  return raw.split(',')[0].trim() || null;
}

export function getClientIp(req: NextApiRequest): string {
  return (
    firstHeader(req, 'x-vercel-forwarded-for') ??
    firstHeader(req, 'x-real-ip') ??
    firstHeader(req, 'x-forwarded-for') ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}

// ---------------------------------------------------------------------------
// Redis client — null when env vars are absent (local dev without Upstash).
// Aceita também os nomes KV_REST_API_* criados pela integração Upstash da Vercel.
// ---------------------------------------------------------------------------
function buildRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = buildRedis();

// ---------------------------------------------------------------------------
// Limiter factory — creates a sliding-window limiter backed by Redis when
// available, or a local ephemeral store for dev. Instances are cached so we
// don't recreate them on every request.
// ---------------------------------------------------------------------------
type LimiterConfig = { requests: number; window: `${number} s` | `${number} m` | `${number} h` };

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(key: string, redisClient: Redis, config: LimiterConfig): Ratelimit {
  if (limiterCache.has(key)) return limiterCache.get(key)!;

  const limiter = new Ratelimit({
    redis: redisClient,
    // Se o Redis não responder rápido, não seguramos o checkout do cliente.
    timeout: 3000,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `rl:${key}`,
    analytics: false,
  });

  limiterCache.set(key, limiter);
  return limiter;
}

// ---------------------------------------------------------------------------
// Per-endpoint configs
// ---------------------------------------------------------------------------
const LIMITS: Record<string, LimiterConfig> = {
  orders:       { requests: 5,  window: '10 m' }, // 5 orders per IP per 10 min
  paypal:       { requests: 10, window: '10 m' }, // PayPal create/capture per IP
  shipping:     { requests: 20, window: '1 m'  }, // 20 CEP lookups per IP per min
  coupons:      { requests: 10, window: '1 m'  }, // 10 attempts — prevents brute-force
  'order-status': { requests: 30, window: '1 m' }, // PIX polling
  // Consulta pública em /rastrear. Curto de propósito: é a única rota que
  // devolve dado de pedido só com número + e-mail.
  'order-track': { requests: 10, window: '5 m' },
  // Salvar carrinho abandonado. O e-mail vem do navegador, então este limite
  // é o que impede alguém de usar a rota para disparar lembrete a estranhos.
  'cart-save': { requests: 5, window: '10 m' },
  // Restaurar/descadastrar pelo token do e-mail.
  'cart-restore': { requests: 20, window: '5 m' },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks the rate limit for the given endpoint key.
 * Sets standard RFC headers (X-RateLimit-*, Retry-After) on every response.
 * Returns true and sends HTTP 429 if the limit is exceeded.
 */
export async function rejectIfRateLimited(
  key: string,
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  const config = LIMITS[key];
  if (!config) return false; // unknown key — don't block

  // Graceful degradation: if Redis is unavailable skip rate limiting rather
  // than taking the site down. Log the failure so we can monitor it.
  if (!redis) {
    console.warn(`[rateLimit] No Redis configured — skipping limit for "${key}"`);
    return false;
  }

  const ip = getClientIp(req);
  const limiter = getLimiter(key, redis, config);

  let result: Awaited<ReturnType<Ratelimit['limit']>>;
  try {
    result = await limiter.limit(ip);
  } catch (err) {
    console.error('[rateLimit] Redis error:', err);
    return false; // fail open — don't block legitimate users on infra errors
  }

  // Always set standard headers so clients/monitors can observe the limits
  res.setHeader('X-RateLimit-Limit', String(config.requests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.reset / 1000)));

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Muitas tentativas. Tente novamente em instantes.' });
    return true;
  }

  return false;
}
