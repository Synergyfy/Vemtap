import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const CLUSTER_CONTEXT_TTL = 60 * 60 * 1000; // 1 hour
// Aligned with the Smart Deal Rotator's rotation window (60s): the deals feed
// now embeds the rotator's featured selection, which changes every window.
export const CLUSTER_DEALS_TTL = 60 * 1000; // 60 seconds (matches rotation window)

interface CacheStoreWithKeys {
  keys(pattern: string): Promise<string[]>;
  del(key: string): Promise<void>;
  client?: {
    scanIterator(opts: {
      MATCH: string;
      COUNT?: number;
    }): AsyncIterable<string>;
  };
}

@Injectable()
export class ClusterCacheService {
  private readonly logger = new Logger(ClusterCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheManager.get<T>(key);
      return cached ?? null;
    } catch (err) {
      this.logger.warn(
        `Cache read failed for "${key}": ${(err as Error).message}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (err) {
      this.logger.warn(
        `Cache write failed for "${key}": ${(err as Error).message}`,
      );
    }
  }

  async invalidateCluster(uniqueCode: string): Promise<void> {
    try {
      const store = this.resolveStore();
      if (store?.keys) {
        const dealKeys = await this.collectKeys(
          store,
          `*cluster:deals:${uniqueCode}:*`,
        );
        const contextKeys = await this.collectKeys(
          store,
          `*cluster:context:${uniqueCode}`,
        );
        const allKeys = [...new Set([...dealKeys, ...contextKeys])];
        for (const key of allKeys) {
          await store.del(key);
        }
      } else {
        await this.cacheManager.del(`cluster:context:${uniqueCode}`);
        const resettable = this.cacheManager as unknown as {
          reset?: () => Promise<void>;
        };
        if (typeof resettable.reset === 'function') {
          await resettable.reset();
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to invalidate cluster cache for ${uniqueCode}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Enumerate matching keys without blocking the Redis keyspace: prefer the
   * store's SCAN cursor iterator when present (node-redis), fall back to
   * `keys()` only for stores that lack one (e.g. the in-memory test store).
   */
  private async collectKeys(
    store: CacheStoreWithKeys,
    pattern: string,
  ): Promise<string[]> {
    const client = store.client;
    if (client && typeof client.scanIterator === 'function') {
      const keys: string[] = [];
      for await (const key of client.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        keys.push(key);
      }
      return keys;
    }
    return store.keys(pattern);
  }

  private resolveStore(): CacheStoreWithKeys | null {
    const cacheMgr = this.cacheManager as unknown as {
      store?: CacheStoreWithKeys;
      stores?: CacheStoreWithKeys[];
    };
    return cacheMgr.store || (cacheMgr.stores?.[0] ?? null);
  }
}
