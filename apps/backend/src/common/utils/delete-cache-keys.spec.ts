import { createCache } from 'cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { deleteCacheKeys } from './delete-cache-keys';

describe('deleteCacheKeys', () => {
  let cache: Cache;

  beforeEach(async () => {
    cache = createCache();
    await cache.set('categories:all:1:20:none', ['a']);
    await cache.set('categories:id:42', { id: 42 });
    await cache.set('offers:public:branch:b1:page1', ['deal']);
    await cache.set('offers:public:details:o1', { id: 'o1' });
    await cache.set('banners:all', ['banner']);
  });

  it('deletes only the keys matching the patterns (cache-manager v6 store)', async () => {
    const deleted = await deleteCacheKeys(cache, ['*categories:*']);

    expect(deleted).toBe(2);
    expect(await cache.get('categories:all:1:20:none')).toBeUndefined();
    expect(await cache.get('categories:id:42')).toBeUndefined();
    expect(await cache.get('banners:all')).toEqual(['banner']);
  });

  it('handles several patterns and ignores empty ones', async () => {
    const deleted = await deleteCacheKeys(cache, [
      '*offers:public:branch:b1:*',
      undefined,
      false,
      '*offers:public:details:o1*',
    ]);

    expect(deleted).toBe(2);
    expect(await cache.get('offers:public:branch:b1:page1')).toBeUndefined();
    expect(await cache.get('offers:public:details:o1')).toBeUndefined();
    expect(await cache.get('categories:id:42')).toEqual({ id: 42 });
  });

  it('treats regex characters in keys literally', async () => {
    await cache.set('cluster:context:AB.C1', 'x');
    await cache.set('cluster:context:ABXC1', 'y');

    await deleteCacheKeys(cache, ['*cluster:context:AB.C1']);

    expect(await cache.get('cluster:context:AB.C1')).toBeUndefined();
    expect(await cache.get('cluster:context:ABXC1')).toBe('y');
  });

  it('uses a legacy store keys() when that is all there is', async () => {
    const deletedKeys: string[] = [];
    const legacy = {
      store: {
        keys: jest.fn().mockResolvedValue(['banners:all', 'banners:active']),
      },
      del: jest.fn((key: string) => {
        deletedKeys.push(key);
        return Promise.resolve(true);
      }),
    } as unknown as Cache;

    expect(await deleteCacheKeys(legacy, ['*banners:*'])).toBe(2);
    expect(deletedKeys).toEqual(['banners:all', 'banners:active']);
  });

  it('clears everything when the store cannot list keys', async () => {
    const clear = jest.fn().mockResolvedValue(true);
    const opaque = { stores: [{}], clear, del: jest.fn() } as unknown as Cache;

    expect(await deleteCacheKeys(opaque, ['*categories:*'])).toBe(-1);
    expect(clear).toHaveBeenCalled();
  });
});
