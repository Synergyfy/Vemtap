import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { deleteCacheKeys } from '../../common/utils/delete-cache-keys';

export const ROTATOR_POOL_TTL = 60 * 1000; // 60s
export const ROTATOR_RESULT_TTL_BUFFER = 10 * 1000; // extra beyond window end

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
      await deleteCacheKeys(this.cacheManager, [`*rotator:*${clusterId}:*`]);
      // The pool key may not match the wildcard; delete it explicitly too.
      await this.cacheManager.del(this.poolKey(clusterId));
    } catch (err) {
      this.logger.error(
        `Failed to invalidate rotator cache for cluster ${clusterId}: ${(err as Error).message}`,
      );
    }
  }
}
