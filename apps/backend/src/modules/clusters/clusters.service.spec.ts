import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClustersService } from './clusters.service';
import { Cluster } from './entities/cluster.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { ClusterCacheService } from './cluster-cache.service';
import { ClusterDealsSortBy } from './dto/cluster-deals-query.dto';

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
    manager: { createQueryBuilder: jest.fn() },
  };

  const offerRepo = {
    createQueryBuilder: jest.fn(),
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

  function buildQb(overrides: Record<string, any> = {}) {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
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
    clusterRepo.create.mockImplementation((data: any) => ({
      id: 'cluster-new',
      ...data,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClustersService,
        { provide: getRepositoryToken(Cluster), useValue: clusterRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
        { provide: ClusterCacheService, useValue: clusterCache },
        { provide: ConfigService, useValue: configService },
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

    const makeOffer = (id: string, branchId: string, date: string) => ({
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
      expect(result.data[0].branch.id).toBe('b1');
      expect(result.data[0].claimedCount).toBe(0);

      const whereCalls = [...qb.where.mock.calls, ...qb.andWhere.mock.calls]
        .map((c: any[]) => c[0])
        .join(' ');
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

      const andWhereCalls = qb.andWhere.mock.calls
        .map((c: any[]) => c[0])
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

      expect(result.data.map((d: any) => d.id)).toEqual(['o2', 'o1']);
    });

    it('adds distance select and uses customer location when provided', async () => {
      const qb = buildQb();
      const o1 = makeOffer('o1', 'b1', '2026-01-05');
      (o1 as any).distanceMeters = 300;
      const o2 = makeOffer('o2', 'b2', '2026-01-04');
      (o2 as any).distanceMeters = 120;
      qb.getMany.mockResolvedValue([o1, o2]);
      offerRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getClusterDeals('CL-ABC123DEF', {
        sortBy: ClusterDealsSortBy.DISTANCE_ASC,
        lat: 9.05,
        lng: 7.49,
      });

      expect(result.reference.source).toBe('customer');
      expect(result.data.map((d: any) => d.id)).toEqual(['o2', 'o1']);
      expect(qb.addSelect).toHaveBeenCalled();
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

        expect(first.data.map((d: any) => d.id)).toEqual(
          second.data.map((d: any) => d.id),
        );
      } finally {
        nowSpy.mockRestore();
      }
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

        expect(resultA.data.map((d: any) => d.id)).toEqual(expectedA);
        expect(resultB.data.map((d: any) => d.id)).toEqual(expectedB);
        expect(resultA.data.map((d: any) => d.id)).not.toEqual(
          resultB.data.map((d: any) => d.id),
        );
      } finally {
        nowSpy.mockRestore();
      }
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

  describe('list', () => {
    it('returns clusters with branch and active offer stats', async () => {
      const qb = buildQb();
      qb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'cl-1',
            name: 'Banex Market',
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
    });
  });
});
