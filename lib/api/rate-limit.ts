/**
 * In-memory sliding-window rate limiter (per-minute bucket).
 *
 * For single-instance Next.js deployments this is sufficient.
 * For multi-instance / serverless, swap the Map for a Redis INCR+EXPIRE call.
 */

interface Bucket {
  count: number;
  minute: number;
}

const store = new Map<string, Bucket>();

const DEFAULT_LIMIT = 60; // requests per minute

// Prune stale entries every 5 minutes to avoid unbounded memory growth
setInterval(
  () => {
    const currentMinute = getCurrentMinute();
    for (const [key, bucket] of store.entries()) {
      if (bucket.minute < currentMinute - 1) store.delete(key);
    }
  },
  5 * 60 * 1000,
).unref();

function getCurrentMinute() {
  return Math.floor(Date.now() / 60_000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

export function checkRateLimit(
  keyId: string,
  limitPerMinute = DEFAULT_LIMIT,
): RateLimitResult {
  const minute = getCurrentMinute();
  const resetAt = new Date((minute + 1) * 60_000);

  const existing = store.get(keyId);

  if (!existing || existing.minute !== minute) {
    store.set(keyId, { count: 1, minute });
    return { allowed: true, remaining: limitPerMinute - 1, limit: limitPerMinute, resetAt };
  }

  existing.count++;

  if (existing.count > limitPerMinute) {
    return { allowed: false, remaining: 0, limit: limitPerMinute, resetAt };
  }

  return {
    allowed: true,
    remaining: limitPerMinute - existing.count,
    limit: limitPerMinute,
    resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  };
}
