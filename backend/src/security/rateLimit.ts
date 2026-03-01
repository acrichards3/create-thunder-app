import type { MiddlewareHandler } from "hono";

type RateLimitOptions = {
  keyGenerator: ((ip: string, path: string) => string) | undefined;
  limit: number;
  windowMs: number;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

let lastPruneAt = 0;
const PRUNE_INTERVAL_MS = 60_000;

function getClientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  const real = headers.get("x-real-ip");
  const xff = headers.get("x-forwarded-for");
  const firstXff = xff?.split(",")[0]?.trim();
  return cf ?? real ?? firstXff ?? "";
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const { limit, windowMs } = options;
  const genKey = options.keyGenerator ?? ((ip: string, path: string): string => `${ip}:${path}`);

  return async (c, next) => {
    const ip = getClientIp(c.req.raw.headers);
    const path = new URL(c.req.url).pathname;
    const key = genKey(ip, path);
    const now = Date.now();

    if (now - lastPruneAt > PRUNE_INTERVAL_MS) {
      lastPruneAt = now;
      pruneExpiredBuckets(now);
    }

    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      c.header("Retry-After", String(retryAfterSec));
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(Math.floor(bucket.resetAt / 1000)));
      return c.text("Too Many Requests", 429);
    }

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
    c.header("X-RateLimit-Reset", String(Math.floor(bucket.resetAt / 1000)));

    await next();
  };
}
