import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClustersService } from './clusters.service';
import { Cluster, ClusterType } from './entities/cluster.entity';
import { ClusterOffer } from './entities/cluster-offer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { ClusterCacheService } from './cluster-cache.service';
import { ClusterDealsSortBy } from './dto/cluster-deals-query.dto';
import { AutoAssignScope } from './dto/cluster.dto';
import {
  CLUSTER_AUTO_ASSIGN_QUEUE,
  CLUSTER_AUTO_ASSIGN_JOB_ID,
} from './cluster-auto-assign.constants';
import { RotatorEngineService } from '../rotator/rotator-engine.service';
import { RotatorAnalyticsService } from '../rotator/rotator-analytics.service';
import { RotatorInvalidationService } from '../rotator/rotator-invalidation.service';

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function bucketTime(bucket: number): number {
  return bucket * 15 * 60 * 1000 + 1;
}

type MockOfferBranch = Partial<Branch>;

type MockOffer = {
  id: string;
  branchId: string;
  branch: MockOfferBranch;
  business: { id: string; name: string };
  name: string;
  description: string;
  longDescription: string | null;
  terms: string[];
  pricingType: string;
  discountValue: number | null;
  fixedPrice: number | null;
  calculatedPrice: number;
  mainImage: string | null;
  galleryImages: string[];
  startDate: Date;
  endDate: Date;
  status: string;
  views: number;
  visits: number;
  quantity: number;
  maxClaimsPerCustomer: number;
  claimCodePrefix: string | null;
  offerType: string | null;
  audience: string | null;
  audienceTarget: string | null;
  createdAt: Date;
  businessId: string;
};

describe('ClustersService', () => {
  let service: ClustersService;

  const clusterRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    increment: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(),
    manager: { createQueryBuilder: jest.fn() },
  };

  const branchRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(),
      query: jest.fn().mockResolvedValue([]) as jest.Mock<
        Promise<any[]>,
        [string]
      >,
    },
  };

  const offerRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const clusterOfferRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    recover: jest.fn(),
  };

  const claimRepo = {
    count: jest.fn().mockResolvedValue(0),
  };

  const clusterCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidateCluster: jest.fn().mockResolvedValue(undefined),
  };

  const configService = {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'VEMTAP_APP_URL') return fallback ?? 'https://vemtap.com';
      return fallback;
    }),
  };

  const autoAssignQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  const rotatorEngine = {
    getCurrentResult: jest.fn().mockResolvedValue(null),
  };

  const rotatorAnalytics = {
    recordImpressions: jest.fn().mockResolvedValue(undefined),
  };

  const rotatorInvalidation = {
    invalidateClusters: jest.fn().mockResolvedValue(undefined),
    invalidateForBranch: jest.fn().mockResolvedValue(undefined),
    invalidateForOffer: jest.fn().mockResolvedValue(undefined),
  };

  type MockQueryBuilder = {
    where: jest.Mock;
    andWhere: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    addSelect: jest.Mock;
    setParameters: jest.Mock;
    take: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    getMany: jest.Mock;
    getManyAndCount: jest.Mock;
    getCount: jest.Mock;
    getRawOne: jest.Mock;
    getOne: jest.Mock;
    getRawMany: jest.Mock;
    innerJoin: jest.Mock;
    from: jest.Mock;
    select: jest.Mock;
  };

  function buildQb(overrides: Record<string, unknown> = {}): MockQueryBuilder {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
      getRawOne: jest.fn(),
      getOne: jest.fn(),
      getRawMany: jest.fn(),
      innerJoin: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      ...overrides,
    };
    return qb;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    clusterRepo.create.mockImplementation((data: Partial<Cluster>) => ({
      id: 'cluster-new',
      ...data,
    }));
    clusterOfferRepo.find.mockResolvedValue([]);
    clusterOfferRepo.create.mockImplementation(
      (data: Partial<ClusterOffer>) => ({
        id: 'cluster-offer-new',
        ...data,
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClustersService,
        { provide: getRepositoryToken(Cluster), useValue: clusterRepo },
        {
          provide: getRepositoryToken(ClusterOffer),
          useValue: clusterOfferRepo,
        },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
        { provide: ClusterCacheService, useValue: clusterCache },
        { provide: ConfigService, useValue: configService },
        {
          provide: getQueueToken(CLUSTER_AUTO_ASSIGN_QUEUE),
          useValue: autoAssignQueue,
        },
        { provide: RotatorEngineService, useValue: rotatorEngine },
        { provide: RotatorAnalyticsService, useValue: rotatorAnalytics },
        { provide: RotatorInvalidationService, useValue: rotatorInvalidation },
      ],
    }).compile();

    service = module.get<ClustersService>(ClustersService);
  });

  describe('getContext', () => {
    it('resolves a cluster by uniqueCode and returns member branches', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        name: 'Banex Market',
        uniqueCode: 'CL-ABC123DEF',
        description: null,
        latitude: 9.0489,
        longitude: 7.4894,
        radiusMeters: 500,
        isActive: true,
        qrIsActive: true,
      });
      branchRepo.find.mockResolvedValue([
        { id: 'b1', name: 'Branch One', username: 'branch-one' },
      ]);

      const result = await service.getContext('CL-ABC123DEF');

      expect(result.qrActive).toBe(true);
      expect(result.cluster.name).toBe('Banex Market');
      expect(result.cluster.qrUrl).toBe('https://vemtap.com/c/CL-ABC123DEF');
      expect(result.branches).toHaveLength(1);
      expect(clusterRepo.increment).toHaveBeenCalledWith(
        { uniqueCode: 'CL-ABC123DEF' },
        'scanCount',
        1,
      );
    });

    it('returns qrActive=false and does not increment scanCount when QR is deactivated', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        name: 'Banex Market',
        uniqueCode: 'CL-ABC123DEF',
        isActive: true,
        qrIsActive: false,
      });
      branchRepo.find.mockResolvedValue([]);

      const result = await service.getContext('CL-ABC123DEF');

      expect(result.qrActive).toBe(false);
      expect(clusterRepo.increment).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown uniqueCode', async () => {
      clusterRepo.findOne.mockResolvedValue(null);
      await expect(service.getContext('CL-NOPE00000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getClusterDeals', () => {
    const baseCluster = {
      id: 'cl-1',
      name: 'Banex Market',
      uniqueCode: 'CL-ABC123DEF',
      latitude: 9.0489,
      longitude: 7.4894,
      isActive: true,
      qrIsActive: true,
    };

    const makeOffer = (
      id: string,
      branchId: string,
      date: string,
    ): MockOffer => ({
      id,
      branchId,
      branch: { id: branchId, name: `Branch ${branchId}` },
      business: { id: 'biz', name: 'Biz' },
      name: `Offer ${id}`,
      description: '',
      longDescription: null,
      terms: [],
      pricingType: 'sum',
      discountValue: null,
      fixedPrice: null,
      calculatedPrice: 100,
      mainImage: null,
      galleryImages: [],
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      views: 0,
      visits: 0,
      quantity: 10,
      maxClaimsPerCustomer: 1,
      claimCodePrefix: null,
      offerType: null,
      audience: null,
      audienceTarget: null,
      createdAt: new Date(date),
      businessId: 'biz',
    });

    beforeEach(() => {
      clusterRepo.findOne.mockResolvedValue(baseCluster);
    });

    it('returns active:false when the cluster QR is deactivated', async () => {
      clusterRepo.findOne.mockResolvedValue({
        ...baseCluster,
        qrIsActive: false,
      });

      const result = await service.getClusterDeals('CL-ABC123DEF', {});

      expect(result.active).toBe(false);
      expect(result.reason).toBe('qr_deactivated');
      expect(result.data).toEqual([]);
    });

    it('applies accuracy predicates and returns mapped deals', async () => {
      const qb = buildQb();
      qb.getMany.mockResolvedValue([makeOffer('o1', 'b1', '2026-01-05')]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getClusterDeals('CL-ABC123DEF', {
        page: 1,
        limit: 10,
      });

      expect(result.active).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('o1');
      expect(result.data[0].branch?.id).toBe('b1');
      expect(result.data[0].claimedCount).toBe(0);

      const whereArgs: string[] = [];
      const whereCallsRaw = qb.where.mock.calls as unknown[][];
      const andWhereCallsRaw = qb.andWhere.mock.calls as unknown[][];
      for (const call of whereCallsRaw) whereArgs.push(String(call[0]));
      for (const call of andWhereCallsRaw) whereArgs.push(String(call[0]));
      const whereCalls = whereArgs.join(' ');
      expect(whereCalls).toContain('offer.status = :status');
      expect(whereCalls).toContain('branch.clusterId = :clusterId');
      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('filters by category and search', async () => {
      const qb = buildQb();
      qb.getMany.mockResolvedValue([]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getClusterDeals('CL-ABC123DEF', {
        categoryId: 'cat-1',
        search: 'grill',
      });

      const andWhereCallArgs = qb.andWhere.mock.calls as unknown[][];
      const andWhereCalls = andWhereCallArgs
        .map((c: unknown[]) => String(c[0]))
        .join(' ');
      expect(andWhereCalls).toContain('business.categoryId = :categoryId');
      expect(andWhereCalls).toContain('offer.name ILIKE :search');
    });

    it('sorts by price ascending when requested', async () => {
      const o1 = makeOffer('o1', 'b1', '2026-01-05');
      o1.calculatedPrice = 250;
      const o2 = makeOffer('o2', 'b2', '2026-01-04');
      o2.calculatedPrice = 50;
      const qb = buildQb();
      qb.getMany.mockResolvedValue([o1, o2]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getClusterDeals('CL-ABC123DEF', {
        sortBy: ClusterDealsSortBy.PRICE_ASC,
      });

      expect(result.data.map((d) => d.id)).toEqual(['o2', 'o1']);
    });

    it('computes distance from branch coordinates and uses customer location when provided', async () => {
      const qb = buildQb();
      const o1 = makeOffer('o1', 'b1', '2026-01-05');
      o1.branch = { ...o1.branch, latitude: 9.052, longitude: 7.492 };
      const o2 = makeOffer('o2', 'b2', '2026-01-04');
      o2.branch = { ...o2.branch, latitude: 9.051, longitude: 7.491 };
      qb.getMany.mockResolvedValue([o1, o2]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getClusterDeals('CL-ABC123DEF', {
        sortBy: ClusterDealsSortBy.DISTANCE_ASC,
        lat: 9.05,
        lng: 7.49,
      });

      expect(result.reference.source).toBe('customer');
      expect(result.data.map((d) => d.id)).toEqual(['o2', 'o1']);
      expect(result.data[0].distanceMeters).toBeGreaterThan(0);
      expect(qb.addSelect).not.toHaveBeenCalled();
    });

    it('uses cluster center as distance reference when no lat/lng provided', async () => {
      const qb = buildQb();
      qb.getMany.mockResolvedValue([]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getClusterDeals('CL-ABC123DEF', {
        sortBy: ClusterDealsSortBy.DISTANCE_ASC,
      });

      expect(result.reference.source).toBe('cluster_center');
      expect(result.reference.lat).toBe(9.0489);
    });

    it('produces deterministic fair rotation within a bucket', async () => {
      const bucket = 1000;
      const nowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValue(bucketTime(bucket));
      try {
        const qb = buildQb();
        qb.getMany.mockResolvedValue([
          makeOffer('o1', 'b1', '2026-01-03'),
          makeOffer('o2', 'b1', '2026-01-02'),
          makeOffer('o3', 'b2', '2026-01-05'),
          makeOffer('o4', 'b2', '2026-01-04'),
        ]);
        offerRepo.createQueryBuilder.mockReturnValue(qb);

        const first = await service.getClusterDeals('CL-ABC123DEF', {});
        const second = await service.getClusterDeals('CL-ABC123DEF', {});

        expect(first.data.map((d) => d.id)).toEqual(
          second.data.map((d) => d.id),
        );
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('ranks pinned offers first regardless of the active sort', async () => {
      const o1 = makeOffer('o1', 'b1', '2026-01-05');
      o1.calculatedPrice = 50;
      const o2 = makeOffer('o2', 'b2', '2026-01-04');
      o2.calculatedPrice = 250;
      const qb = buildQb();
      qb.getMany.mockResolvedValue([o1, o2]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);
      clusterOfferRepo.find.mockResolvedValue([
        { offerId: 'o2', pinnedAt: new Date('2026-01-10') },
      ]);

      const result = await service.getClusterDeals('CL-ABC123DEF', {
        sortBy: ClusterDealsSortBy.PRICE_ASC,
      });

      expect(result.data.map((d) => d.id)).toEqual(['o2', 'o1']);
      expect(clusterOfferRepo.find).toHaveBeenCalledWith({
        where: { clusterId: 'cl-1', isPinned: true },
        select: ['offerId', 'pinnedAt'],
      });
    });

    it('rotates which branch leads across buckets', async () => {
      // Find two buckets whose rotation offsets differ
      const memberCount = 2;
      let bucketA = 1000;
      let bucketB = 1000;
      for (let i = 1000; i < 1100; i++) {
        if (bucketA === 1000) bucketA = i;
        else if (
          stableHash(`cl-1:${i}`) % memberCount !==
          stableHash(`cl-1:${bucketA}`) % memberCount
        ) {
          bucketB = i;
          break;
        }
      }

      const nowSpy = jest.spyOn(Date, 'now');
      try {
        const qb = buildQb();
        qb.getMany.mockResolvedValue([
          makeOffer('o1', 'b1', '2026-01-03'),
          makeOffer('o3', 'b2', '2026-01-05'),
        ]);
        offerRepo.createQueryBuilder.mockReturnValue(qb);

        nowSpy.mockReturnValue(bucketTime(bucketA));
        const resultA = await service.getClusterDeals('CL-ABC123DEF', {});

        nowSpy.mockReturnValue(bucketTime(bucketB));
        const resultB = await service.getClusterDeals('CL-ABC123DEF', {});

        const offsetA = stableHash(`cl-1:${bucketA}`) % memberCount;
        const expectedA = offsetA === 0 ? ['o1', 'o3'] : ['o3', 'o1'];
        const offsetB = stableHash(`cl-1:${bucketB}`) % memberCount;
        const expectedB = offsetB === 0 ? ['o1', 'o3'] : ['o3', 'o1'];

        expect(resultA.data.map((d) => d.id)).toEqual(expectedA);
        expect(resultB.data.map((d) => d.id)).toEqual(expectedB);
        expect(resultA.data.map((d) => d.id)).not.toEqual(
          resultB.data.map((d) => d.id),
        );
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('keys the deals cache on the current rotation window and passes the session token to impressions', async () => {
      rotatorEngine.getCurrentResult.mockResolvedValue({
        clusterId: 'cl-1',
        windowId: 98765,
        slotCount: 1,
        featured: ['o1'],
      });

      const o1 = makeOffer('o1', 'b1', '2026-01-05');
      const qb = buildQb();
      qb.getMany.mockResolvedValue([o1]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getClusterDeals(
        'CL-ABC123DEF',
        {},
        'sess-123',
      );

      expect(clusterCache.get).toHaveBeenCalledWith(
        expect.stringContaining(':98765:'),
      );
      expect(clusterCache.set).toHaveBeenCalledWith(
        expect.stringContaining(':98765:'),
        expect.any(Object),
        expect.any(Number),
      );
      expect(result.featured?.map((d) => d.id)).toEqual(['o1']);
      expect(result.rotationWindowId).toBe(98765);
      expect(rotatorAnalytics.recordImpressions).toHaveBeenCalledWith(
        'cl-1',
        ['o1'],
        98765,
        { sessionToken: 'sess-123' },
      );
    });

    it('excludes offers from suspended businesses from the feed', async () => {
      const qb = buildQb();
      qb.getMany.mockResolvedValue([]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getClusterDeals('CL-ABC123DEF', {});

      const andWhereCallArgs = qb.andWhere.mock.calls as unknown[][];
      const andWhereCalls = andWhereCallArgs
        .map((c: unknown[]) => String(c[0]))
        .join(' ');
      expect(andWhereCalls).toContain('business.status = :businessStatus');
    });

    it('keys the deals cache distinctly per limit', async () => {
      rotatorEngine.getCurrentResult.mockResolvedValue({
        clusterId: 'cl-1',
        windowId: 98765,
        slotCount: 1,
        featured: ['o1'],
      });
      const o1 = makeOffer('o1', 'b1', '2026-01-05');
      const qb = buildQb();
      qb.getMany.mockResolvedValue([o1]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);
      clusterCache.get.mockResolvedValue(null);

      await service.getClusterDeals('CL-ABC123DEF', { limit: 10 });
      await service.getClusterDeals('CL-ABC123DEF', { limit: 50 });

      const setKeys = (clusterCache.set.mock.calls as unknown[][]).map(
        (c: unknown[]) => String(c[0]),
      );
      expect(setKeys).toHaveLength(2);
      expect(setKeys[0]).not.toBe(setKeys[1]);
    });
  });

  describe('admin CRUD', () => {
    it('creates a cluster with a CL- prefixed uniqueCode', async () => {
      const saved = {
        id: 'cl-new',
        uniqueCode: 'CL-9XZ7KL2PQ',
        name: 'Apo Zone E',
        description: null,
        latitude: 9.0,
        longitude: 7.5,
        radiusMeters: 500,
        isActive: true,
        qrIsActive: true,
        scanCount: 0,
        createdAt: new Date(),
      };
      clusterRepo.save.mockResolvedValue(saved);
      clusterRepo.findOne.mockResolvedValue(saved);
      branchRepo.find.mockResolvedValue([]);

      const result = await service.create(
        { name: 'Apo Zone E', latitude: 9.0, longitude: 7.5 },
        'admin-1',
      );

      expect(clusterRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'admin-1' }),
      );
      expect(result.uniqueCode).toBe('CL-9XZ7KL2PQ');
    });

    it('updates qrIsActive and invalidates the cluster cache', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
        name: 'Banex Market',
        isActive: true,
        qrIsActive: true,
      });
      clusterRepo.save.mockImplementation((data: any) => Promise.resolve(data));
      branchRepo.find.mockResolvedValue([]);

      const result = await service.update('cl-1', { qrIsActive: false });

      expect(result.qrIsActive).toBe(false);
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith(
        'CL-ABC123DEF',
      );
    });

    it('removes a cluster by releasing branches and soft-deleting', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
      });

      const result = await service.remove('cl-1');

      expect(branchRepo.update).toHaveBeenCalledWith(
        { clusterId: 'cl-1' },
        { clusterId: null },
      );
      expect(clusterRepo.softDelete).toHaveBeenCalledWith('cl-1');
      expect(result.success).toBe(true);
    });

    it('addBranch updates membership and invalidates previous + new clusters', async () => {
      clusterRepo.findOne
        .mockResolvedValueOnce({
          id: 'cl-2',
          uniqueCode: 'CL-NEW22222',
        })
        .mockResolvedValueOnce({
          id: 'cl-1',
          uniqueCode: 'CL-OLD11111',
        });
      branchRepo.findOne.mockResolvedValue({
        id: 'b1',
        clusterId: 'cl-1',
      });
      branchRepo.save.mockImplementation((b: any) => Promise.resolve(b));

      await service.addBranch('cl-2', 'b1');

      expect(branchRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'b1', clusterId: 'cl-2' }),
      );
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith(
        'CL-NEW22222',
      );
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith(
        'CL-OLD11111',
      );
    });

    it('removeBranch clears membership and invalidates cluster', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
      });
      branchRepo.findOne.mockResolvedValue({
        id: 'b1',
        clusterId: 'cl-1',
      });

      await service.removeBranch('cl-1', 'b1');

      expect(branchRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ clusterId: null }),
      );
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith(
        'CL-ABC123DEF',
      );
    });

    it('invalidateForBranch resolves the branch cluster and invalidates it', async () => {
      branchRepo.findOne.mockResolvedValue({ id: 'b1', clusterId: 'cl-1' });
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
      });

      await service.invalidateForBranch('b1');

      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith(
        'CL-ABC123DEF',
      );
    });

    it('invalidateForBranch is a no-op when branch has no cluster', async () => {
      branchRepo.findOne.mockResolvedValue({ id: 'b1', clusterId: null });

      await service.invalidateForBranch('b1');

      expect(clusterRepo.findOne).not.toHaveBeenCalled();
      expect(clusterCache.invalidateCluster).not.toHaveBeenCalled();
    });
  });

  describe('admin offers (auto-match + pin/unpin)', () => {
    const makeOffer = (id: string, branchId: string): MockOffer => ({
      id,
      branchId,
      branch: { id: branchId, name: `Branch ${branchId}` },
      business: { id: 'biz', name: 'Biz' },
      name: `Offer ${id}`,
      description: '',
      longDescription: null,
      terms: [],
      pricingType: 'sum',
      discountValue: null,
      fixedPrice: null,
      calculatedPrice: 100,
      mainImage: null,
      galleryImages: [],
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      views: 0,
      visits: 0,
      quantity: 10,
      maxClaimsPerCustomer: 1,
      claimCodePrefix: null,
      offerType: null,
      audience: null,
      audienceTarget: null,
      createdAt: new Date('2026-01-05'),
      businessId: 'biz',
    });

    it('throws NotFoundException for an unknown cluster', async () => {
      clusterRepo.findOne.mockResolvedValue(null);
      await expect(service.getClusterOffers('cl-nope', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns autoMatched offers and pinned offers with totals', async () => {
      clusterRepo.findOne.mockResolvedValue({ id: 'cl-1' });
      const qb = buildQb();
      qb.getMany.mockResolvedValue([
        makeOffer('o1', 'b1'),
        makeOffer('o2', 'b2'),
      ]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);
      clusterOfferRepo.find.mockResolvedValue([
        { offerId: 'o2', pinnedAt: new Date('2026-01-10') },
      ]);
      offerRepo.find.mockResolvedValue([makeOffer('o2', 'b2')]);

      const result = await service.getClusterOffers('cl-1', {});

      expect(result.autoMatched.map((d) => d.id)).toEqual(['o1', 'o2']);
      expect(result.pinned.map((d) => d.id)).toEqual(['o2']);
      expect(result.total).toBe(2);
      expect(offerRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['branch', 'business', 'items'] }),
      );
    });

    it('pins an offer (upsert) and invalidates the cluster cache', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
      });
      offerRepo.findOne.mockResolvedValue({ id: 'o1' });
      clusterOfferRepo.findOne.mockResolvedValue(null);

      const result = await service.setOfferPinned(
        'cl-1',
        'o1',
        { pinned: true },
        'admin-1',
      );

      expect(result).toEqual({
        pinned: true,
        offerId: 'o1',
        clusterId: 'cl-1',
      });
      expect(clusterOfferRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clusterId: 'cl-1',
          offerId: 'o1',
          isPinned: true,
          pinnedBy: 'admin-1',
        }),
      );
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith(
        'CL-ABC123DEF',
      );
    });

    it('unpins an offer by toggling isPinned off (row kept for re-pin)', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
      });
      offerRepo.findOne.mockResolvedValue({ id: 'o1' });
      const existing = { id: 'co-1', clusterId: 'cl-1', offerId: 'o1' };
      clusterOfferRepo.findOne.mockResolvedValue(existing);

      const result = await service.setOfferPinned(
        'cl-1',
        'o1',
        { pinned: false },
        'admin-1',
      );

      expect(result.pinned).toBe(false);
      expect(clusterOfferRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ ...existing, isPinned: false }),
      );
      expect(clusterOfferRepo.remove).not.toHaveBeenCalled();
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith(
        'CL-ABC123DEF',
      );
    });

    it('restores a soft-deleted row when re-pinning', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
      });
      offerRepo.findOne.mockResolvedValue({ id: 'o1' });
      const trashed = { id: 'co-1', clusterId: 'cl-1', offerId: 'o1' };
      clusterOfferRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(trashed);

      const result = await service.setOfferPinned(
        'cl-1',
        'o1',
        { pinned: true },
        'admin-1',
      );

      expect(result.pinned).toBe(true);
      expect(clusterOfferRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
      expect(clusterOfferRepo.recover).toHaveBeenCalledWith(
        expect.objectContaining({
          ...trashed,
          isPinned: true,
          pinnedBy: 'admin-1',
        }),
      );
      expect(clusterOfferRepo.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when pinning an unknown offer', async () => {
      clusterRepo.findOne.mockResolvedValue({
        id: 'cl-1',
        uniqueCode: 'CL-ABC123DEF',
      });
      offerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.setOfferPinned('cl-1', 'o-nope', { pinned: true }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns clusters with branch and active offer stats', async () => {
      const qb = buildQb();
      qb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'cl-1',
            name: 'Banex Market',
            type: ClusterType.MARKET,
            parentId: null,
            country: 'Nigeria',
            state: 'FCT',
            city: 'Abuja',
            area: 'Banex',
            uniqueCode: 'CL-ABC123DEF',
            description: null,
            latitude: 9.0,
            longitude: 7.5,
            radiusMeters: 500,
            isActive: true,
            qrIsActive: true,
            scanCount: 10,
            createdAt: new Date(),
          },
        ],
        1,
      ]);
      clusterRepo.createQueryBuilder.mockReturnValue(qb);

      const countQb = buildQb();
      countQb.getCount.mockResolvedValue(3);
      offerRepo.createQueryBuilder.mockReturnValue(countQb);
      branchRepo.count.mockResolvedValue(2);

      const result = await service.list({ page: 1, limit: 20 });

      expect(result.meta.total).toBe(1);
      expect(result.data[0].branchCount).toBe(2);
      expect(result.data[0].activeOfferCount).toBe(3);
      expect(result.data[0].qrIsActive).toBe(true);
      expect(result.data[0]).toMatchObject({
        type: ClusterType.MARKET,
        parentId: null,
        country: 'Nigeria',
        state: 'FCT',
        city: 'Abuja',
        area: 'Banex',
      });
    });
  });

  describe('auto-assign', () => {
    function mockQueryRows(rows: any[]) {
      branchRepo.manager.query.mockResolvedValue(rows);
    }

    it('computes nearest covering clusters in a single batch query', async () => {
      mockQueryRows([
        {
          branchId: 'b-1',
          currentClusterId: null,
          clusterId: 'cl-1',
          distanceMeters: 100,
        },
      ]);

      await service.autoAssign({ dryRun: true });

      expect(branchRepo.manager.query).toHaveBeenCalledTimes(1);
      const sql = branchRepo.manager.query.mock.calls[0][0];
      expect(sql).toContain('LEFT JOIN LATERAL');
      expect(sql).toContain('COALESCE');
      expect(branchRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('with default scope only considers branches without a cluster', async () => {
      mockQueryRows([
        {
          branchId: 'b-1',
          currentClusterId: null,
          clusterId: 'cl-1',
          distanceMeters: 100,
        },
        {
          branchId: 'b-2',
          currentClusterId: null,
          clusterId: 'cl-1',
          distanceMeters: 150,
        },
      ]);

      const result = await service.autoAssign({ dryRun: true });

      const sql = branchRepo.manager.query.mock.calls[0][0];
      expect(sql).toContain('b."clusterId" IS NULL');
      expect(result).toMatchObject({
        dryRun: true,
        scope: AutoAssignScope.UNASSIGNED,
        totalCandidates: 2,
        assigned: 2,
        reassigned: 0,
      });
      expect(branchRepo.update).not.toHaveBeenCalled();
    });

    it('commits assignments and invalidates the new clusters when not a dry run', async () => {
      mockQueryRows([
        {
          branchId: 'b-1',
          currentClusterId: null,
          clusterId: 'cl-1',
          distanceMeters: 100,
        },
      ]);

      clusterRepo.find.mockResolvedValue([
        { id: 'cl-1', uniqueCode: 'CL-NEW' },
      ]);

      const result = await service.autoAssign({ dryRun: false });

      expect(branchRepo.update).toHaveBeenCalledWith(
        { id: 'b-1' },
        { clusterId: 'cl-1' },
      );
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith('CL-NEW');
      expect(result).toMatchObject({
        dryRun: false,
        assigned: 1,
        reassigned: 0,
      });
    });

    it("with scope 'all' reassigns a branch to a different covering cluster", async () => {
      mockQueryRows([
        {
          branchId: 'b-1',
          currentClusterId: 'cl-old',
          clusterId: 'cl-new',
          distanceMeters: 50,
        },
      ]);

      clusterRepo.find.mockResolvedValue([
        { id: 'cl-new', uniqueCode: 'CL-NEW' },
        { id: 'cl-old', uniqueCode: 'CL-OLD' },
      ]);

      const result = await service.autoAssign({
        scope: AutoAssignScope.ALL,
      });

      expect(branchRepo.update).toHaveBeenCalledWith(
        { id: 'b-1' },
        { clusterId: 'cl-new' },
      );
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith('CL-NEW');
      expect(clusterCache.invalidateCluster).toHaveBeenCalledWith('CL-OLD');
      expect(result).toMatchObject({
        scope: AutoAssignScope.ALL,
        assigned: 1,
        reassigned: 1,
      });
    });

    it("with scope 'all' leaves a branch untouched when no covering cluster exists", async () => {
      mockQueryRows([
        {
          branchId: 'b-1',
          currentClusterId: 'cl-old',
          clusterId: null,
          distanceMeters: null,
        },
      ]);

      const result = await service.autoAssign({
        scope: AutoAssignScope.ALL,
      });

      expect(branchRepo.update).not.toHaveBeenCalled();
      expect(result).toMatchObject({ assigned: 0, reassigned: 0 });
    });

    it("with scope 'all' leaves a branch untouched when nearest cluster is already its cluster", async () => {
      mockQueryRows([
        {
          branchId: 'b-1',
          currentClusterId: 'cl-1',
          clusterId: 'cl-1',
          distanceMeters: 50,
        },
      ]);

      const result = await service.autoAssign({
        scope: AutoAssignScope.ALL,
      });

      expect(branchRepo.update).not.toHaveBeenCalled();
      expect(result).toMatchObject({ assigned: 0, reassigned: 0 });
    });

    it('commits large reassignments in bounded parallel chunks', async () => {
      const rows = Array.from({ length: 120 }, (_, i) => ({
        branchId: `b-${i}`,
        currentClusterId: 'cl-old',
        clusterId: 'cl-new',
        distanceMeters: 50,
      }));
      mockQueryRows(rows);
      clusterRepo.find.mockResolvedValue([]);

      const result = await service.autoAssign({ scope: AutoAssignScope.ALL });

      expect(branchRepo.update).toHaveBeenCalledTimes(120);
      expect(result).toMatchObject({ assigned: 120, reassigned: 120 });
    });

    it('with async=true enqueues a background job with a fixed jobId', async () => {
      const result = await service.autoAssign({
        async: true,
        scope: AutoAssignScope.ALL,
      });

      expect(autoAssignQueue.add).toHaveBeenCalledWith(
        'auto-assign',
        { scope: AutoAssignScope.ALL },
        expect.objectContaining({ jobId: CLUSTER_AUTO_ASSIGN_JOB_ID }),
      );
      expect(result).toEqual({ enqueued: true, jobId: 'job-1' });
      expect(branchRepo.manager.query).not.toHaveBeenCalled();
    });
  });
});
