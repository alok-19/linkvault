interface CacheEntry<T> {
  value: T;
  expires: number;
}

class LruCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize = 100, defaultTtlMs = 3000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.delete(key);
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlMs ?? this.defaultTtl),
    });
  }

  invalidate(keyPrefix?: string) {
    if (!keyPrefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }
}

// Single-user app: 3s TTL is plenty. Cache 200 entries max.
export const apiCache = new LruCache<unknown>(200, 3000);
