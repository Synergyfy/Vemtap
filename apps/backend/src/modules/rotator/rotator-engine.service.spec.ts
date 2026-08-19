import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RotatorEngineService } from './rotator-engine.service';
import { Cluster } from '../clusters/entities/cluster.entity';
import { RotatorRotationRecord } from './entities/rotator-rotation-record.entity';
import {
  RotatorEligibilityService,
  EligiblePoolOffer,
} from './rotator-eligibility.service';
import { RotatorCacheService } from './rotator-cache.service';
import {
  featuredSlotsForDealCount,
  rotationWindowId,
} from './rotator.constants';

function makePoolOffer(
  offerId: string,
  branchId: string,
  overrides: Partial<EligiblePoolOffer> = {},
): EligiblePoolOffer {
  return {
    offerId,
    branchId,
    businessId: 'biz-' + offerId,
    branchName: 'Branch ' + branchId,
    businessName: 'Business ' + offerId,
    weight: 1,
    pinned: false,
    ...overrides,
  };
}

describe('RotatorEngineService', () => {
  let service: RotatorEngineService;

  const clusterRepo = {
    findOne: jest.fn(),
  };

  const recordRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((d: object) => d),
    save: jest.fn((d: object) => Promise.resolve({ id: 'rec-1', ...d })),
  };

  const cache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    invalidateCluster: jest.fn().mockResolvedValue(undefined),
    poolKey: jest.fn((id: string) => `rotator:pool:${id}`),
    resultKey: jest.fn((id: string, w: number) => `rotator:result:${id}:${w}`),
  };

  const eligibility = {
    getCluster: jest.fn(),
    getGlobalConfig: jest.fn(),
    getClusterConfig: jest.fn(),
    getEligiblePool: jest.fn(),
    orderByDistribution: jest.fn(),
    explain: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorEngineService,
        { provide: getRepositoryToken(Cluster), useValue: clusterRepo },
        {
          provide: getRepositoryToken(RotatorRotationRecord),
          useValue: recordRepo,
        },
        { provide: RotatorEligibilityService, useValue: eligibility },
        { provide: RotatorCacheService, useValue: cache },
      ],
    }).compile();

    service = module.get(RotatorEngineService);
  });

  it('uses cached result for the same window', async () => {
    eligibility.getCluster.mockResolvedValue({ id: 'c1' });
    eligibility.getGlobalConfig.mockResolvedValue({ windowSeconds: 60 });
    cache.get.mockResolvedValue({
      clusterId: 'c1',
      windowId: 123,
      windowStart: new Date(),
      windowEnd: new Date(),
      slotCount: 3,
      featured: ['o1', 'o2', 'o3'],
    });

    const result = await service.getCurrentResult('c1');
    expect(result.featured).toEqual(['o1', 'o2', 'o3']);
    expect(eligibility.getEligiblePool).not.toHaveBeenCalled();
    // M4: a cached window must not touch the DB (no cluster read) — only the
    // global config (itself TTL-cached) is needed to resolve the windowId.
    expect(eligibility.getCluster).not.toHaveBeenCalled();
  });

  it('generates and caches a result when cache misses', async () => {
    eligibility.getCluster.mockResolvedValue({ id: 'c1' });
    eligibility.getGlobalConfig.mockResolvedValue({ windowSeconds: 60 });
    eligibility.getEligiblePool.mockResolvedValue([
      makePoolOffer('o1', 'b1'),
      makePoolOffer('o2', 'b2'),
      makePoolOffer('o3', 'b3'),
    ]);
    eligibility.getClusterConfig.mockResolvedValue(null);
    eligibility.orderByDistribution.mockImplementation(
      (pool: EligiblePoolOffer[], _c: string, w: number) => {
        // deterministic: rotate by window
        const first = w % pool.length;
        return [...pool.slice(first), ...pool.slice(0, first)];
      },
    );
    cache.get.mockResolvedValue(null);

    const result = await service.getCurrentResult('c1');
    expect(result.featured.length).toBeGreaterThan(0);
    expect(recordRepo.save).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalled();
    // Configs are resolved once and preloaded into ordering (no duplicate reads).
    const calls = eligibility.orderByDistribution.mock.calls as unknown[][];
    const preloaded = calls[0][3] as { global?: { windowSeconds?: number } };
    expect(preloaded?.global).toEqual({ windowSeconds: 60 });
  });

  it('selects only as many slots as eligible deals (never pads)', async () => {
    eligibility.getCluster.mockResolvedValue({ id: 'c1' });
    eligibility.getGlobalConfig.mockResolvedValue({ windowSeconds: 60 });
    eligibility.getEligiblePool.mockResolvedValue([
      makePoolOffer('o1', 'b1'),
      makePoolOffer('o2', 'b2'),
    ]);
    eligibility.getClusterConfig.mockResolvedValue(null);
    eligibility.orderByDistribution.mockImplementation(
      (pool: EligiblePoolOffer[]) => pool,
    );
    cache.get.mockResolvedValue(null);

    const result = await service.getCurrentResult('c1');
    expect(result.featured.length).toBe(2);
  });

  it('preview generates N windows without persisting records', async () => {
    eligibility.getCluster.mockResolvedValue({ id: 'c1' });
    eligibility.getGlobalConfig.mockResolvedValue({ windowSeconds: 60 });
    eligibility.getEligiblePool.mockResolvedValue([
      makePoolOffer('o1', 'b1'),
      makePoolOffer('o2', 'b2'),
      makePoolOffer('o3', 'b3'),
      makePoolOffer('o4', 'b4'),
    ]);
    eligibility.getClusterConfig.mockResolvedValue(null);
    eligibility.orderByDistribution.mockImplementation(
      (pool: EligiblePoolOffer[], _c: string, w: number) => {
        const first = w % pool.length;
        return [...pool.slice(first), ...pool.slice(0, first)];
      },
    );

    const results = await service.preview('c1', 3);
    expect(results.length).toBe(3);
    expect(recordRepo.save).not.toHaveBeenCalled();
    // Preview simulates future windows, so it must always build a fresh pool.
    expect(eligibility.getEligiblePool).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ ignoreCache: true }),
    );
    // consecutive windows should differ when pool > slots
    const sets = results.map((r) => r.featured.join(','));
    expect(new Set(sets).size).toBeGreaterThan(1);
  });

  it('generates with a cached pool on the live path (Layer 1 read)', async () => {
    eligibility.getCluster.mockResolvedValue({ id: 'c1' });
    eligibility.getGlobalConfig.mockResolvedValue({ windowSeconds: 60 });
    eligibility.getEligiblePool.mockResolvedValue([
      makePoolOffer('o1', 'b1'),
      makePoolOffer('o2', 'b2'),
    ]);
    eligibility.getClusterConfig.mockResolvedValue(null);
    eligibility.orderByDistribution.mockImplementation(
      (pool: EligiblePoolOffer[]) => pool,
    );
    cache.get.mockResolvedValue(null);

    await service.getCurrentResult('c1');

    // The live generate path must consult the Layer 1 pool cache instead of
    // always bypassing it (the pool cache is useless if never read).
    expect(eligibility.getEligiblePool).toHaveBeenCalledWith(
      'c1',
      expect.not.objectContaining({ ignoreCache: true }),
    );
  });

  it('throws when cluster not found', async () => {
    eligibility.getCluster.mockRejectedValue(
      new NotFoundException('Cluster not found'),
    );
    await expect(service.getCurrentResult('nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('featuredSlotsForDealCount', () => {
    it('maps eligible deal counts to automatic slot counts', () => {
      expect(featuredSlotsForDealCount(0)).toBe(0);
      expect(featuredSlotsForDealCount(2)).toBe(2);
      expect(featuredSlotsForDealCount(8)).toBe(3);
      expect(featuredSlotsForDealCount(15)).toBe(4);
      expect(featuredSlotsForDealCount(70)).toBe(5);
      expect(featuredSlotsForDealCount(70, 4)).toBe(4);
    });
  });

  describe('rotationWindowId', () => {
    it('buckets time into 60s windows', () => {
      expect(rotationWindowId(0, 60)).toBe(0);
      expect(rotationWindowId(59_999, 60)).toBe(0);
      expect(rotationWindowId(60_000, 60)).toBe(1);
    });
  });
});
