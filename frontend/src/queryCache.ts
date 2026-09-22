/**
 * queryCache — lightweight in-memory TTL cache for API responses.
 *
 * Usage:
 *   queryCache.get<T>(key)           → T | null
 *   queryCache.set(key, data, ttlMs) → void
 *   queryCache.invalidate(key)       → void
 *   queryCache.invalidatePrefix(pfx) → void  (e.g. 'jobs/' clears all job entries)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();

export const queryCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set<T>(key: string, data: T, ttlMs: number): void {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
  },

  invalidate(key: string): void {
    store.delete(key);
  },

  /** Remove all entries whose key starts with the given prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  clear(): void {
    store.clear();
  },
};

// TTL constants (milliseconds)
export const TTL = {
  JOBS_LIST:       10_000,   // 10 s  — job list (changes when jobs start/finish)
  FILES_LIST:      30_000,   // 30 s  — uploaded files list
  ANALYSIS_RESULT: 60_000,   // 60 s  — completed analysis (immutable once done)
  STAGES:          60_000,   // 60 s  — stages (immutable once completed)
  HEALTH:          20_000,   // 20 s  — health endpoint
  DEMOS_LIST:     300_000,   // 5 min — demo signals rarely change
};
