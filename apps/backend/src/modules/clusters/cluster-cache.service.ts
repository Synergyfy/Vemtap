import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { deleteCacheKeys } from '../../common/utils/delete-cache-keys';

export const CLUSTER_CONTEXT_TTL = 60 * 60 * 1000; // 1 hour
// Aligned with the Smart Deal Rotator's rotation window (60s): the deals feed
// now embeds the rotator's featured selection, which changes every window.
export const CLUSTER_DEALS_TTL = 60 * 1000; // 60 seconds (matches rotation window)

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
      await deleteCacheKeys(this.cacheManager, [
        `*cluster:deals:${uniqueCode}:*`,
        `*cluster:context:${uniqueCode}`,
      ]);
    } catch (err) {
      this.logger.error(
        `Failed to invalidate cluster cache for ${uniqueCode}: ${(err as Error).message}`,
      );
    }
  }
}
