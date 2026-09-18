import { createHash } from "node:crypto";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const LOOKUP_WINDOW_MS = 60_000;

export function hashIpForRateLimit(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export function isRateLimited(
  key: string,
  limit: number,
  windowMs = LOOKUP_WINDOW_MS,
): boolean {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (current.count >= limit) {
    return true;
  }

  current.count += 1;
  return false;
}

export function clearRateLimitBuckets() {
  buckets.clear();
}