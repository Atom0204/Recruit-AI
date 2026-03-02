const bucket = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export const enforceRateLimit = ({ key, limit, windowMs }: RateLimitOptions): boolean => {
  const now = Date.now();
  const current = bucket.get(key);

  if (!current || current.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  bucket.set(key, { ...current, count: current.count + 1 });
  return true;
};
