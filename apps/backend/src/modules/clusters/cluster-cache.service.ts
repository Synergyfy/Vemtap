import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const CLUSTER_CONTEXT_TTL = 60 * 60 * 1000; // 1 hour
export const CLUSTER_DEALS_TTL = 15 * 60 * 1000; // 15 minutes (matches rotation bucket)

@Injectable()
export class ClusterCacheService {
  private readonly logger = new Logger(ClusterCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheManager.get<T>(key);
      return cached ?? null;
    } catch (err) {
      this.logger.warn(`Cache read failed for "${key}": ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (err) {
      this.logger.warn(`Cache write failed for "${key}": ${err.message}`);
    }
  }

  async invalidateCluster(uniqueCode: string): Promise<void> {
    try {
      const cacheMgr = this.cacheManager as any;
      const store =
        cacheMgr.store || (cacheMgr.stores ? cacheMgr.stores[0] : null);

      if (store && typeof store.keys === 'function') {
        const dealKeys = await store.keys(`*cluster:deals:${uniqueCode}:*`);
        const contextKeys = await store.keys(`*cluster:context:${uniqueCode}`);
        const allKeys = [...new Set([...dealKeys, ...contextKeys])];
        for (const key of allKeys) {
          if (typeof store.del === 'function') {
            await store.del(key);
          } else {
            await this.cacheManager.del(key);
          }
        }
      } else {
        await this.cacheManager.del(`cluster:context:${uniqueCode}`);
        if (typeof (this.cacheManager as any).reset === 'function') {
          await (this.cacheManager as any).reset();
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to invalidate cluster cache for ${uniqueCode}: ${err.message}`,
      );
    }
  }
}
