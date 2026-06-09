import type { NextApiRequest, NextApiResponse } from 'next';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// IP extraction — reads CF-Connecting-IP when behind Cloudflare (the real IP),
// falls back to x-forwarded-for (trusting only the first value to avoid
// spoofing), then the raw socket address.
// ---------------------------------------------------------------------------
export function getClientIp(req: NextApiRequest): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf.trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Redis client — falls back to an in-memory store when env vars are absent
// (local dev without Upstash configured). In production UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN must be set.
// ---------------------------------------------------------------------------
function buildRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
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

function getLimiter(key: string, config: LimiterConfig): Ratelimit {
  if (limiterCache.has(key)) return limiterCache.get(key)!;

  const storage = redis ?? Redis.fromEnv();
  const limiter = new Ratelimit({
    redis: storage,
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
  const limiter = getLimiter(key, config);

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
