import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cluster } from '../clusters/entities/cluster.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import {
  RotatorImpression,
  RotatorEventType,
} from './entities/rotator-impression.entity';
import { RotatorRotationRecord } from './entities/rotator-rotation-record.entity';
import { RotatorAnalyticsService } from './rotator-analytics.service';
import { RotatorEligibilityService } from './rotator-eligibility.service';
import { ROTATOR_REFRESH_QUEUE } from './rotator.constants';

const REFRESH_QUEUE_TOKEN = `BullQueue_${ROTATOR_REFRESH_QUEUE}`;

function createCacheManager() {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn((key: string) => (store.has(key) ? store.get(key) : null)),
    set: jest.fn((key: string, value: unknown) => {
      store.set(key, value);
    }),
    clearStore: () => store.clear(),
  };
}

const cacheManager = createCacheManager();

describe('RotatorAnalyticsService.recordViewOrClick', () => {
  let service: RotatorAnalyticsService;

  const impressionRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    create: jest.fn((d: object) => d),
  };

  const emptyRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((d: object) => d),
    save: jest.fn((d: object) => Promise.resolve(d)),
    createQueryBuilder: jest.fn(),
  };

  const eligibility = {
    getGlobalConfig: jest.fn().mockResolvedValue({ windowSeconds: 60 }),
  };

  const refreshQueue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorAnalyticsService,
        { provide: getRepositoryToken(Cluster), useValue: emptyRepo },
        {
          provide: getRepositoryToken(RotatorImpression),
          useValue: impressionRepo,
        },
        {
          provide: getRepositoryToken(RotatorRotationRecord),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: emptyRepo,
        },
        {
          provide: REFRESH_QUEUE_TOKEN,
          useValue: refreshQueue,
        },
        { provide: RotatorEligibilityService, useValue: eligibility },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get(RotatorAnalyticsService);
  });

  it('enqueues a view job and never writes synchronously', async () => {
    await service.recordViewOrClick(RotatorEventType.VIEW, 'cl-1', 'offer-1', {
      sessionToken: '11111111-1111-1111-1111-111111111111',
      windowId: 42,
    });

    expect(refreshQueue.add).toHaveBeenCalledWith(
      'record-view-click',
      expect.objectContaining({
        eventType: RotatorEventType.VIEW,
        clusterId: 'cl-1',
        offerId: 'offer-1',
        windowId: 42,
        sessionToken: '11111111-1111-1111-1111-111111111111',
      }),
      expect.objectContaining({ attempts: 5 }),
    );
    expect(impressionRepo.save).not.toHaveBeenCalled();
  });

  it('resolves the current window when none is supplied', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(120_000);

    await service.recordViewOrClick(RotatorEventType.VIEW, 'cl-1', 'offer-1', {
      sessionToken: '11111111-1111-1111-1111-111111111111',
    });

    expect(refreshQueue.add).toHaveBeenCalledWith(
      'record-view-click',
      expect.objectContaining({ windowId: 2 }),
      expect.any(Object),
    );
    jest.restoreAllMocks();
  });

  it('ignores unexpected event types without enqueuing', async () => {
    await service.recordViewOrClick(
      RotatorEventType.IMPRESSION,
      'cl-1',
      'offer-1',
      {},
    );

    expect(refreshQueue.add).not.toHaveBeenCalled();
    expect(impressionRepo.save).not.toHaveBeenCalled();
  });
});

describe('RotatorAnalyticsService.recordImpressions', () => {
  let service: RotatorAnalyticsService;

  const impressionRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    create: jest.fn((d: object) => d),
  };

  const emptyRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((d: object) => d),
    save: jest.fn((d: object) => Promise.resolve(d)),
    createQueryBuilder: jest.fn(),
  };

  const eligibility = {
    getGlobalConfig: jest.fn().mockResolvedValue({ windowSeconds: 60 }),
  };

  const refreshQueue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    cacheManager.clearStore();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorAnalyticsService,
        { provide: getRepositoryToken(Cluster), useValue: emptyRepo },
        {
          provide: getRepositoryToken(RotatorImpression),
          useValue: impressionRepo,
        },
        {
          provide: getRepositoryToken(RotatorRotationRecord),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: emptyRepo,
        },
        {
          provide: REFRESH_QUEUE_TOKEN,
          useValue: refreshQueue,
        },
        { provide: RotatorEligibilityService, useValue: eligibility },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get(RotatorAnalyticsService);
  });

  it('enqueues impressions once per (cluster, window, visitor)', async () => {
    await service.recordImpressions('cl-1', ['o1', 'o2'], 42, {
      sessionToken: '11111111-1111-1111-1111-111111111111',
    });
    await service.recordImpressions('cl-1', ['o1', 'o2'], 42, {
      sessionToken: '11111111-1111-1111-1111-111111111111',
    });

    expect(refreshQueue.add).toHaveBeenCalledTimes(1);
    expect(refreshQueue.add).toHaveBeenCalledWith(
      'record-impressions',
      expect.objectContaining({ clusterId: 'cl-1', windowId: 42 }),
      expect.any(Object),
    );
  });

  it('uses an anon bucket so tokenless repeat views do not fan out', async () => {
    cacheManager.set.mockClear();
    await service.recordImpressions('cl-1', ['o1'], 7, {});
    await service.recordImpressions('cl-1', ['o1'], 7, {});

    expect(refreshQueue.add).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledWith(
      expect.stringContaining(':anon'),
      true,
      expect.any(Number),
    );
  });

  it('dedupes a new window separately', async () => {
    await service.recordImpressions('cl-1', ['o1'], 1, {});
    await service.recordImpressions('cl-1', ['o1'], 2, {});

    expect(refreshQueue.add).toHaveBeenCalledTimes(2);
  });
});

describe('RotatorAnalyticsService.persistImpressions', () => {
  let service: RotatorAnalyticsService;

  const impressionRepo = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((d: object) => d),
    save: jest.fn().mockResolvedValue(undefined),
  };

  const emptyRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((d: object) => d),
    save: jest.fn((d: object) => Promise.resolve(d)),
    createQueryBuilder: jest.fn(),
  };

  const eligibility = {
    getGlobalConfig: jest.fn().mockResolvedValue({ windowSeconds: 60 }),
  };

  const refreshQueue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    cacheManager.clearStore();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorAnalyticsService,
        { provide: getRepositoryToken(Cluster), useValue: emptyRepo },
        {
          provide: getRepositoryToken(RotatorImpression),
          useValue: impressionRepo,
        },
        {
          provide: getRepositoryToken(RotatorRotationRecord),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: emptyRepo,
        },
        {
          provide: REFRESH_QUEUE_TOKEN,
          useValue: refreshQueue,
        },
        { provide: RotatorEligibilityService, useValue: eligibility },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get(RotatorAnalyticsService);
  });

  it('persists all offers in a single batched save', async () => {
    await service.persistImpressions({
      clusterId: 'cl-1',
      offerIds: ['o1', 'o2', 'o3'],
      windowId: 42,
      customerId: null,
      sessionToken: null,
    });

    expect(impressionRepo.find).not.toHaveBeenCalled();
    expect(impressionRepo.save).toHaveBeenCalledTimes(1);
    expect(impressionRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({ offerId: 'o1', windowId: '42' }),
      expect.objectContaining({ offerId: 'o2', windowId: '42' }),
      expect.objectContaining({ offerId: 'o3', windowId: '42' }),
    ]);
  });

  it('dedupes against already-persisted offers with a single find', async () => {
    impressionRepo.find.mockResolvedValue([
      { offerId: 'o1', windowId: '42' },
      { offerId: 'o2', windowId: '42' },
    ]);

    await service.persistImpressions({
      clusterId: 'cl-1',
      offerIds: ['o1', 'o2', 'o3'],
      windowId: 42,
      customerId: null,
      sessionToken: '11111111-1111-1111-1111-111111111111',
    });

    expect(impressionRepo.find).toHaveBeenCalledTimes(1);
    expect(impressionRepo.save).toHaveBeenCalledTimes(1);
    expect(impressionRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({ offerId: 'o3' }),
    ]);
  });

  it('skips the write when every offer is already persisted', async () => {
    impressionRepo.find.mockResolvedValue([{ offerId: 'o1', windowId: '42' }]);

    await service.persistImpressions({
      clusterId: 'cl-1',
      offerIds: ['o1'],
      windowId: 42,
      customerId: null,
      sessionToken: '11111111-1111-1111-1111-111111111111',
    });

    expect(impressionRepo.find).toHaveBeenCalledTimes(1);
    expect(impressionRepo.save).not.toHaveBeenCalled();
  });
});

describe('RotatorAnalyticsService.persistViewOrClick', () => {
  let service: RotatorAnalyticsService;

  const impressionRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    create: jest.fn((d: object) => d),
  };

  const emptyRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((d: object) => d),
    save: jest.fn((d: object) => Promise.resolve(d)),
    createQueryBuilder: jest.fn(),
  };

  const eligibility = {
    getGlobalConfig: jest.fn().mockResolvedValue({ windowSeconds: 60 }),
  };

  const refreshQueue = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorAnalyticsService,
        { provide: getRepositoryToken(Cluster), useValue: emptyRepo },
        {
          provide: getRepositoryToken(RotatorImpression),
          useValue: impressionRepo,
        },
        {
          provide: getRepositoryToken(RotatorRotationRecord),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: emptyRepo,
        },
        {
          provide: REFRESH_QUEUE_TOKEN,
          useValue: refreshQueue,
        },
        { provide: RotatorEligibilityService, useValue: eligibility },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get(RotatorAnalyticsService);
  });

  it('records a view when no row exists for the session', async () => {
    impressionRepo.findOne.mockResolvedValue(null);

    await service.persistViewOrClick({
      eventType: RotatorEventType.VIEW,
      clusterId: 'cl-1',
      offerId: 'offer-1',
      windowId: 42,
      sessionToken: '11111111-1111-1111-1111-111111111111',
    });

    expect(impressionRepo.save).toHaveBeenCalledTimes(1);
    expect(impressionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        clusterId: 'cl-1',
        offerId: 'offer-1',
        windowId: '42',
        eventType: RotatorEventType.VIEW,
        sessionToken: '11111111-1111-1111-1111-111111111111',
      }),
    );
  });

  it('does not double-count a view for the same session/window/offer', async () => {
    impressionRepo.findOne.mockResolvedValue({ id: 'existing-1' });

    await service.persistViewOrClick({
      eventType: RotatorEventType.CLICK,
      clusterId: 'cl-1',
      offerId: 'offer-1',
      windowId: 7,
      sessionToken: '11111111-1111-1111-1111-111111111111',
    });

    expect(impressionRepo.save).not.toHaveBeenCalled();
  });

  it('records without dedup when no session token is provided', async () => {
    await service.persistViewOrClick({
      eventType: RotatorEventType.VIEW,
      clusterId: 'cl-1',
      offerId: 'offer-1',
      windowId: 5,
      sessionToken: null,
    });

    expect(impressionRepo.findOne).not.toHaveBeenCalled();
    expect(impressionRepo.save).toHaveBeenCalledTimes(1);
  });
});

describe('RotatorAnalyticsService.getClusterSummary', () => {
  let service: RotatorAnalyticsService;

  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ uniquePeople: '7' }),
    getCount: jest.fn().mockResolvedValue(3),
  };

  const clusterRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'cl-1', scanCount: 12 }),
  };

  const impressionRepo = {
    count: jest.fn().mockResolvedValue(50),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  };

  const recordRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  const offerRepo = {};

  const claimRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  };

  const eligibility = {
    getGlobalConfig: jest.fn(),
  };

  const refreshQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorAnalyticsService,
        { provide: getRepositoryToken(Cluster), useValue: clusterRepo },
        {
          provide: getRepositoryToken(RotatorImpression),
          useValue: impressionRepo,
        },
        {
          provide: getRepositoryToken(RotatorRotationRecord),
          useValue: recordRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: offerRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
        {
          provide: REFRESH_QUEUE_TOKEN,
          useValue: refreshQueue,
        },
        { provide: RotatorEligibilityService, useValue: eligibility },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get(RotatorAnalyticsService);
  });

  it('computes unique people via SQL COUNT(DISTINCT COALESCE(...))', async () => {
    const summary = await service.getClusterSummary('cl-1', 30);

    expect(impressionRepo.createQueryBuilder).toHaveBeenCalled();
    expect(qb.getRawOne).toHaveBeenCalled();
    expect(summary.uniquePeople).toBe(7);
    expect(summary.impressions).toBe(50);
    expect(summary.redemptions).toBe(3);
    expect(summary.lifetimeScans).toBe(12);
  });
});
