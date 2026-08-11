import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ClusterCacheService,
  CLUSTER_CONTEXT_TTL,
  CLUSTER_DEALS_TTL,
} from './cluster-cache.service';

describe('ClusterCacheService', () => {
  let service: ClusterCacheService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      keys: jest.fn(),
      del: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClusterCacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ClusterCacheService>(ClusterCacheService);
  });

  it('returns cached value when present', async () => {
    mockCacheManager.get.mockResolvedValue({ hello: 'world' });
    const value = await service.get('cluster:context:CL-ABC');
    expect(value).toEqual({ hello: 'world' });
    expect(mockCacheManager.get).toHaveBeenCalledWith('cluster:context:CL-ABC');
  });

  it('returns null when cache is empty', async () => {
    mockCacheManager.get.mockResolvedValue(undefined);
    const value = await service.get('cluster:context:CL-ABC');
    expect(value).toBeNull();
  });

  it('stores values with the provided TTL', async () => {
    await service.set('k', { v: 1 }, CLUSTER_DEALS_TTL);
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      'k',
      { v: 1 },
      CLUSTER_DEALS_TTL,
    );
  });

  it('stores context with the context TTL', async () => {
    await service.set('cluster:context:CL-ABC', { v: 1 }, CLUSTER_CONTEXT_TTL);
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      'cluster:context:CL-ABC',
      { v: 1 },
      CLUSTER_CONTEXT_TTL,
    );
  });

  it('invalidates context and deals keys for a cluster', async () => {
    mockCacheManager.store.keys
      .mockResolvedValueOnce([
        'cluster:deals:CL-ABC:100:123:1',
        'cluster:deals:CL-ABC:100:123:2',
      ])
      .mockResolvedValueOnce(['cluster:context:CL-ABC']);

    await service.invalidateCluster('CL-ABC');

    expect(mockCacheManager.store.del).toHaveBeenCalledWith(
      'cluster:deals:CL-ABC:100:123:1',
    );
    expect(mockCacheManager.store.del).toHaveBeenCalledWith(
      'cluster:deals:CL-ABC:100:123:2',
    );
    expect(mockCacheManager.store.del).toHaveBeenCalledWith(
      'cluster:context:CL-ABC',
    );
  });

  it('survives cache read failures gracefully', async () => {
    mockCacheManager.get.mockRejectedValue(new Error('redis down'));
    const value = await service.get('cluster:context:CL-ABC');
    expect(value).toBeNull();
  });
});
