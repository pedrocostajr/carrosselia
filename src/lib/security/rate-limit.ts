/**
 * Simple in-memory sliding-window rate limiter for API routes (AI + URL
 * import endpoints). This is process-local: sufficient for a single-instance
 * deployment or demo use. For multi-instance production deployments, replace
 * the store with a shared backend (e.g. Upstash Redis) - the interface below
 * is intentionally small so that swap is a one-file change.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0];
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, windowMs - (now - oldest)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.hits.length, resetInMs: windowMs };
}

// Periodically clear stale buckets to avoid unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.hits.every((t) => now - t > 10 * 60 * 1000)) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export const RATE_LIMITS = {
  aiGeneration: { limit: 10, windowMs: 60_000 },
  aiSlideAction: { limit: 20, windowMs: 60_000 },
  urlImport: { limit: 8, windowMs: 60_000 },
} as const;
