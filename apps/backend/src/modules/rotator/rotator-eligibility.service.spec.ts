import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RotatorEligibilityService } from './rotator-eligibility.service';
import { Cluster } from '../clusters/entities/cluster.entity';
import { Branch } from '../branches/entities/branch.entity';
import {
  Business,
  BusinessStatus,
} from '../businesses/entities/business.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import { RotatorClusterOffer } from './entities/rotator-cluster-offer.entity';
import { RotatorDealSchedule } from './entities/rotator-deal-schedule.entity';
import { RotatorConfig } from './entities/rotator-config.entity';
import { RotatorClusterConfig } from './entities/rotator-cluster-config.entity';
import { RotatorCacheService } from './rotator-cache.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';

function makeOffer(id: string, overrides: Partial<CatalogueOffer> = {}) {
  return {
    id,
    status: CatalogueOfferStatus.ACTIVE,
    startDate: null,
    endDate: null,
    businessId: 'biz-1',
    branch: { id: 'br-1', clusterId: 'c1', isActive: true },
    business: { status: BusinessStatus.ACTIVE },
    ...overrides,
  } as Partial<CatalogueOffer> & {
    branch: { id: string; clusterId: string; isActive: boolean };
    business: { status: BusinessStatus };
  };
}

describe('RotatorEligibilityService', () => {
  let service: RotatorEligibilityService;

  const clusterRepo = { findOne: jest.fn() };
  const branchRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const offerRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
  const clusterOfferRepo = { find: jest.fn(), findOne: jest.fn() };
  const scheduleRepo = {
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(),
  };
  const configRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const clusterConfigRepo = { findOne: jest.fn() };
  const subscriptionRepo = { findOne: jest.fn() };

  const cache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidateCluster: jest.fn().mockResolvedValue(undefined),
    poolKey: jest.fn((id: string) => `rotator:pool:${id}`),
    resultKey: jest.fn(),
  };

  function buildQb(rows: Record<string, unknown>[] = []) {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows),
      getRawOne: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    return qb;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    offerRepo.createQueryBuilder.mockReturnValue(buildQb());
    clusterOfferRepo.find.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorEligibilityService,
        { provide: getRepositoryToken(Cluster), useValue: clusterRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        {
          provide: getRepositoryToken(RotatorClusterOffer),
          useValue: clusterOfferRepo,
        },
        {
          provide: getRepositoryToken(RotatorDealSchedule),
          useValue: scheduleRepo,
        },
        { provide: getRepositoryToken(RotatorConfig), useValue: configRepo },
        {
          provide: getRepositoryToken(RotatorClusterConfig),
          useValue: clusterConfigRepo,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepo,
        },
        { provide: RotatorCacheService, useValue: cache },
      ],
    }).compile();

    service = module.get(RotatorEligibilityService);
  });

  it('returns eligible pool in automatic mode (all eligible deals)', async () => {
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        distribution: 'balanced',
        featuredSlotsMode: 'automatic',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);
    offerRepo.createQueryBuilder.mockReturnValue(
      buildQb([
        {
          offerId: 'o1',
          branchId: 'b1',
          businessId: 'bi1',
          branchName: 'B1',
          businessName: 'Biz1',
          pinned: false,
          startDate: null,
          endDate: null,
        },
        {
          offerId: 'o2',
          branchId: 'b2',
          businessId: 'bi2',
          branchName: 'B2',
          businessName: 'Biz2',
          pinned: true,
          startDate: null,
          endDate: null,
        },
      ]),
    );

    const pool = await service.getEligiblePool('c1', { ignoreCache: true });
    expect(pool.map((p) => p.offerId).sort()).toEqual(['o1', 'o2']);
    expect(pool.find((p) => p.offerId === 'o2')?.pinned).toBe(true);
  });

  it('pinned subquery excludes soft-deleted cluster_offers rows', async () => {
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);

    const qb = buildQb([
      {
        offerId: 'o1',
        branchId: 'b1',
        businessId: 'bi1',
        branchName: 'B1',
        businessName: 'Biz1',
        pinned: false,
        startDate: null,
        endDate: null,
      },
    ]);
    offerRepo.createQueryBuilder.mockReturnValue(qb);

    await service.getEligiblePool('c1', { ignoreCache: true });

    const leftJoinCalls = qb.leftJoin.mock.calls as unknown[][];
    const subqueryCb = leftJoinCalls[0][0] as (q: unknown) => unknown;
    const subQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    };
    subqueryCb(subQb);

    expect(subQb.where).toHaveBeenCalledWith('co."isPinned" = true');
    expect(subQb.andWhere).toHaveBeenCalledWith('co."deletedAt" IS NULL');
  });

  it('filters the eligible pool to businesses with an active Discovery subscription', async () => {
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);

    const qb = buildQb([
      {
        offerId: 'o1',
        branchId: 'b1',
        businessId: 'bi1',
        branchName: 'B1',
        businessName: 'Biz1',
        pinned: false,
        startDate: null,
        endDate: null,
      },
    ]);
    offerRepo.createQueryBuilder.mockReturnValue(qb);

    await service.getEligiblePool('c1', { ignoreCache: true });

    const andWhereCalls = (qb.andWhere.mock.calls as unknown[][])
      .map((c: unknown[]) => String(c[0]))
      .join(' ');
    expect(andWhereCalls).toContain('"subscriptions"');
    expect(andWhereCalls).toContain('INNER JOIN "plans" plan');
    expect(andWhereCalls).toContain('sub."status" IN');
    expect(andWhereCalls).toContain('sub."deletedAt" IS NULL');
    expect(andWhereCalls).toContain('plan."discoveryEnabled" = true');
  });

  it('manual mode keeps only included (non-excluded) deals', async () => {
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'manual',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);
    offerRepo.createQueryBuilder.mockReturnValue(
      buildQb([
        {
          offerId: 'o1',
          branchId: 'b1',
          businessId: 'bi1',
          branchName: 'B1',
          businessName: 'Biz1',
          pinned: false,
          startDate: null,
          endDate: null,
        },
        {
          offerId: 'o2',
          branchId: 'b2',
          businessId: 'bi2',
          branchName: 'B2',
          businessName: 'Biz2',
          pinned: false,
          startDate: null,
          endDate: null,
        },
      ]),
    );
    clusterOfferRepo.find.mockResolvedValue([
      { offerId: 'o1', included: true },
      { offerId: 'o2', included: false },
    ]);

    const pool = await service.getEligiblePool('c1', { ignoreCache: true });
    expect(pool.map((p) => p.offerId)).toEqual(['o1']);
  });

  it('explain marks an expired deal as not eligible', async () => {
    const expired = makeOffer('o-exp', {
      endDate: new Date(Date.now() - 1000),
    });
    offerRepo.findOne.mockResolvedValue(expired);
    scheduleRepo.find.mockResolvedValue([]);
    subscriptionRepo.findOne.mockResolvedValue({
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: { discoveryEnabled: true },
    });
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        distribution: 'balanced',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);
    clusterOfferRepo.findOne.mockResolvedValue(null);

    const explanation = await service.explain('c1', 'o-exp');
    expect(explanation.eligible).toBe(false);
    expect(explanation.notExpired).toBe(false);
    expect(explanation.status).toBe('Expired');
  });

  it('explain marks an eligible active deal correctly', async () => {
    offerRepo.findOne.mockResolvedValue(makeOffer('o-ok'));
    scheduleRepo.find.mockResolvedValue([]);
    subscriptionRepo.findOne.mockResolvedValue({
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: { discoveryEnabled: true },
    });
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        distribution: 'balanced',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);
    clusterOfferRepo.findOne.mockResolvedValue(null);

    const explanation = await service.explain('c1', 'o-ok');
    expect(explanation.eligible).toBe(true);
    expect(explanation.subscriptionActive).toBe(true);
    expect(explanation.planHasDiscovery).toBe(true);
    expect(explanation.status).toBe('Eligible');
  });

  it('explain excludes a deal whose business has no active Discovery subscription', async () => {
    offerRepo.findOne.mockResolvedValue(makeOffer('o-sub'));
    scheduleRepo.find.mockResolvedValue([]);
    subscriptionRepo.findOne.mockResolvedValue(null);
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        distribution: 'balanced',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);
    clusterOfferRepo.findOne.mockResolvedValue(null);

    const explanation = await service.explain('c1', 'o-sub');
    expect(explanation.eligible).toBe(false);
    expect(explanation.subscriptionActive).toBe(false);
    expect(explanation.planHasDiscovery).toBe(false);
    expect(explanation.status).toBe('Excluded');
    expect(explanation.reasons).toContain(
      'Business has no active subscription with the Discovery plan',
    );
  });

  it('explain excludes a deal whose plan lacks the Discovery feature', async () => {
    offerRepo.findOne.mockResolvedValue(makeOffer('o-nodisc'));
    scheduleRepo.find.mockResolvedValue([]);
    subscriptionRepo.findOne.mockResolvedValue({
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: { discoveryEnabled: false },
    });
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        distribution: 'balanced',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);
    clusterOfferRepo.findOne.mockResolvedValue(null);

    const explanation = await service.explain('c1', 'o-nodisc');
    expect(explanation.eligible).toBe(false);
    expect(explanation.planHasDiscovery).toBe(false);
    expect(explanation.status).toBe('Excluded');
  });

  it('throws NotFound for explain when offer missing', async () => {
    offerRepo.findOne.mockResolvedValue(null);
    await expect(service.explain('c1', 'nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('balanced ordering is deterministic within a window', async () => {
    const offers = [
      makePoolOfferShape('o1', 'b1'),
      makePoolOfferShape('o2', 'b2'),
      makePoolOfferShape('o3', 'b3'),
    ];
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        distribution: 'balanced',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);

    const a = await service.orderByDistribution(offers, 'c1', 42);
    const b = await service.orderByDistribution(offers, 'c1', 42);
    expect(a.map((o) => o.offerId)).toEqual(b.map((o) => o.offerId));
    expect(a.map((o) => o.offerId).sort()).toEqual(['o1', 'o2', 'o3']);
  });

  it('weighted ordering puts higher weights first', async () => {
    const offers = [
      makePoolOfferShape('o1', 'b1', { weight: 1 }),
      makePoolOfferShape('o2', 'b2', { weight: 3 }),
      makePoolOfferShape('o3', 'b3', { weight: 2 }),
    ];
    configRepo.find.mockResolvedValue([
      {
        rotationMode: 'automatic',
        distribution: 'weighted',
        windowSeconds: 60,
        frequencyWindowHours: 24,
      },
    ]);
    clusterConfigRepo.findOne.mockResolvedValue(null);

    const ordered = await service.orderByDistribution(offers, 'c1', 1);
    expect(ordered[0].offerId).toBe('o2');
    expect(ordered[1].offerId).toBe('o3');
  });

  it('caches the global config for a short TTL and invalidates on demand', async () => {
    configRepo.find.mockResolvedValue([{ windowSeconds: 60 }]);

    const first = await service.getGlobalConfig();
    const second = await service.getGlobalConfig();

    expect(first.windowSeconds).toBe(60);
    expect(second).toBe(first);
    expect(configRepo.find).toHaveBeenCalledTimes(1);

    service.invalidateGlobalConfigCache();
    await service.getGlobalConfig();
    expect(configRepo.find).toHaveBeenCalledTimes(2);
  });

  it('adopts the winner row when a concurrent replica wins the singleton race', async () => {
    // First find: no row. save: unique-violation (23505) from the DB.
    // Second find: the replica's row.
    configRepo.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ windowSeconds: 90 }]);
    configRepo.save.mockRejectedValueOnce({ code: '23505' });

    const config = await service.getGlobalConfig();

    expect(config.windowSeconds).toBe(90);
    expect(configRepo.save).toHaveBeenCalledTimes(1);
  });

  function makePoolOfferShape(
    offerId: string,
    branchId: string,
    overrides: Record<string, any> = {},
  ) {
    return {
      offerId,
      branchId,
      businessId: 'biz',
      branchName: 'Branch',
      businessName: 'Biz',
      weight: 1,
      pinned: false,
      ...overrides,
    };
  }
});
