import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const ROTATOR_POOL_TTL = 60 * 1000; // 60s
export const ROTATOR_RESULT_TTL_BUFFER = 10 * 1000; // extra beyond window end

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
export class RotatorCacheService {
  private readonly logger = new Logger(RotatorCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  poolKey(clusterId: string): string {
    return `rotator:pool:${clusterId}`;
  }

  resultKey(clusterId: string, windowId: number): string {
    return `rotator:result:${clusterId}:${windowId}`;
  }

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

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (err) {
      this.logger.warn(
        `Cache delete failed for "${key}": ${(err as Error).message}`,
      );
    }
  }

  /**
   * Removes every rotator key for a cluster (both pool and all window results).
   * Handles both the redis store (keys()/del) and the in-memory test store.
   */
  async invalidateCluster(clusterId: string): Promise<void> {
    try {
      const store = this.resolveStore();
      if (store?.keys) {
        const keys = await this.collectKeys(store, `*rotator:*${clusterId}:*`);
        for (const key of keys) {
          await store.del(key);
        }
        // Pool key is covered by the wildcard above, but delete explicitly too.
        await this.cacheManager.del(this.poolKey(clusterId));
      } else {
        await this.cacheManager.del(this.poolKey(clusterId));
        const resettable = this.cacheManager as unknown as {
          reset?: () => Promise<void>;
        };
        if (typeof resettable.reset === 'function') {
          await resettable.reset();
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to invalidate rotator cache for cluster ${clusterId}: ${(err as Error).message}`,
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
