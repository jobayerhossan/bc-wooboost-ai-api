import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";

type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();

export function assertRateLimit(key: string) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.expiresAt <= now) {
    buckets.set(key, {
      count: 1,
      expiresAt: now + env.rateLimit.windowMs,
    });
    return;
  }

  if (existing.count >= env.rateLimit.max) {
    throw new ApiError(429, "Too many requests. Please try again shortly.");
  }

  existing.count += 1;
  buckets.set(key, existing);
}
