// Memory cache with TTL for API responses
const store = new Map<string, { until: number; data: any }>();

export function getCache(key: string): any | null {
  const item = store.get(key);
  return item && item.until > Date.now() ? item.data : null;
}

export function setCache(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
  store.set(key, { until: Date.now() + ttlMs, data });
}

export function clearCache(pattern?: string): void {
  if (pattern) {
    const keys = Array.from(store.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        store.delete(key);
      }
    }
  } else {
    store.clear();
  }
}