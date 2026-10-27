import { Logger } from '@nestjs/common';
import type { Cache } from '@nestjs/cache-manager';

const logger = new Logger('CacheInvalidation');

/** `*` matches any run of characters; everything else is literal. */
const globToRegExp = (pattern: string) =>
  new RegExp(
    `^${pattern
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`,
  );

interface LegacyStore {
  keys?: (pattern: string) => Promise<string[]>;
  del?: (key: string) => Promise<unknown>;
  /** Redis-backed stores (cache-manager-redis-yet) expose the node-redis client. */
  client?: {
    scanIterator?: (options: {
      MATCH: string;
      COUNT: number;
    }) => AsyncIterable<string>;
  };
}

interface IterableStore {
  iterator?: () => AsyncIterable<[string, unknown]>;
}

/**
 * Deletes every cached key matching any of `patterns` (glob, `*` wildcard).
 *
 * Works with cache-manager v6 (Keyv stores listed through `iterator()`) and
 * with older stores (Redis SCAN, or `keys(pattern)`). If no store can list its
 * keys, the whole cache is cleared rather than leaving stale entries behind.
 * Returns how many keys were deleted (-1 when the cache was cleared).
 */
export async function deleteCacheKeys(
  cache: Cache,
  patterns: Array<string | false | null | undefined>,
): Promise<number> {
  const wanted = patterns.filter((pattern): pattern is string =>
    Boolean(pattern),
  );
  if (!wanted.length) return 0;
  const matchers = wanted.map(globToRegExp);

  const manager = cache as unknown as {
    store?: LegacyStore;
    stores?: Array<LegacyStore & IterableStore>;
    clear?: () => Promise<unknown>;
    reset?: () => Promise<unknown>;
  };
  const stores = [manager.store, ...(manager.stores ?? [])].filter(
    Boolean,
  ) as Array<LegacyStore & IterableStore>;

  // Keys found per store, deleted through that store when it can (legacy
  // stores), otherwise through the cache manager.
  const found = new Map<string, LegacyStore | null>();
  let listed = false;
  for (const store of stores) {
    const scan = store.client?.scanIterator;
    if (typeof scan === 'function') {
      listed = true;
      for (const pattern of wanted) {
        for await (const key of scan.call(store.client, {
          MATCH: pattern,
          COUNT: 100,
        })) {
          found.set(key, store);
        }
      }
    } else if (typeof store.iterator === 'function') {
      listed = true;
      for await (const [key] of store.iterator()) {
        if (matchers.some((matcher) => matcher.test(key))) found.set(key, null);
      }
    } else if (typeof store.keys === 'function') {
      listed = true;
      for (const pattern of wanted) {
        for (const key of await store.keys(pattern)) found.set(key, store);
      }
    }
  }

  if (!listed) {
    logger.warn(
      `Cache store cannot list keys; clearing the whole cache to drop ${wanted.join(', ')}`,
    );
    if (typeof manager.clear === 'function') await manager.clear();
    else if (typeof manager.reset === 'function') await manager.reset();
    return -1;
  }

  for (const [key, store] of found) {
    if (store && typeof store.del === 'function') await store.del(key);
    else await cache.del(key);
  }
  return found.size;
}
