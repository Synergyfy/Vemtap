import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PublicDiscoveryService } from './public-discovery.service';
import {
  Business,
  BusinessStatus,
} from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Category } from '../businesses/entities/category.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { CatalogueOfferService } from '../catalogue/catalogue-offer.service';

describe('PublicDiscoveryService', () => {
  let service: PublicDiscoveryService;

  const businessRepo = {
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };
  const branchRepo = { count: jest.fn() };
  const categoryRepo = { find: jest.fn() };
  const offerRepo = { createQueryBuilder: jest.fn(), count: jest.fn() };
  const claimRepo = { count: jest.fn() };
  const catalogueOfferService = {
    findAllOffersPublicGlobal: jest.fn(),
  };
  const cacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const makeBusinessQb = (rows: any[] = []) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(rows),
  });

  const makeOfferQb = (count = 0) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicDiscoveryService,
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: getRepositoryToken(CatalogueOffer), useValue: offerRepo },
        {
          provide: getRepositoryToken(CatalogueOfferClaim),
          useValue: claimRepo,
        },
        { provide: CatalogueOfferService, useValue: catalogueOfferService },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<PublicDiscoveryService>(PublicDiscoveryService);
  });

  describe('findBusinesses', () => {
    it('returns only active businesses mapped with slug from the main branch', async () => {
      const qb = makeBusinessQb([
        {
          id: 'biz-1',
          name: 'The Azure Bistro',
          status: BusinessStatus.ACTIVE,
          logoUrl: 'https://example.com/logo.png',
          description: 'Fine dining',
          address: '42 Admiralty Way',
          state: 'Lagos',
          city: 'Ikeja',
          categoryId: 'cat-1',
          category: { name: 'Restaurant' },
          isVerified: true,
          uniqueCode: 'BIZ123XYZ',
          branches: [
            {
              isMainBranch: true,
              username: 'azure-bistro',
              uniqueCode: 'BR123ABC',
            },
            {
              isMainBranch: false,
              username: 'azure-annex',
              uniqueCode: 'BR456DEF',
            },
          ],
        },
      ]);
      businessRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findBusinesses(undefined, 8);

      expect(businessRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('business.status = :status', {
        status: BusinessStatus.ACTIVE,
      });
      expect(result).toEqual([
        expect.objectContaining({
          id: 'biz-1',
          name: 'The Azure Bistro',
          categoryName: 'Restaurant',
          slug: 'azure-bistro',
          branchCode: 'BR123ABC',
        }),
      ]);
    });

    it('filters by name when a keyword is provided', async () => {
      const qb = makeBusinessQb([]);
      businessRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findBusinesses('azure', 8);
      expect(qb.andWhere).toHaveBeenCalledWith('business.name ILIKE :q', {
        q: '%azure%',
      });
    });
  });

  describe('search', () => {
    it('returns empty result groups for an empty query', async () => {
      const result = await service.search(undefined, 8);
      expect(result).toEqual({ deals: [], businesses: [], categories: [] });
      expect(
        catalogueOfferService.findAllOffersPublicGlobal,
      ).not.toHaveBeenCalled();
    });

    it('returns deals, businesses and categories', async () => {
      catalogueOfferService.findAllOffersPublicGlobal.mockResolvedValue({
        data: [{ id: 'offer-1' }],
        total: 1,
      });
      categoryRepo.find.mockResolvedValue([
        { id: 'cat-1', name: 'Restaurant', description: 'Eat out' },
      ]);
      const qb = makeBusinessQb([
        { id: 'biz-1', name: 'Azure', uniqueCode: 'BIZ1', branches: [] },
      ]);
      businessRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.search('azure', 8);

      expect(
        catalogueOfferService.findAllOffersPublicGlobal,
      ).toHaveBeenCalledWith({
        search: 'azure',
        limit: 8,
      });
      expect(result.deals).toEqual([{ id: 'offer-1' }]);
      expect(result.businesses[0]).toMatchObject({ id: 'biz-1', slug: 'BIZ1' });
      expect(result.categories).toEqual([
        { id: 'cat-1', name: 'Restaurant', description: 'Eat out' },
      ]);
    });
  });

  describe('getStats', () => {
    it('computes and caches the four core metrics', async () => {
      cacheManager.get.mockResolvedValue(null);
      businessRepo.count.mockResolvedValue(120);
      offerRepo.createQueryBuilder.mockReturnValue(makeOfferQb(45));
      claimRepo.count.mockResolvedValue(320);
      branchRepo.count.mockResolvedValue(200);

      const result = await service.getStats();

      expect(result).toEqual({
        totalBusinesses: 120,
        totalActiveDeals: 45,
        totalClaims: 320,
        totalBranches: 200,
      });
      expect(claimRepo.count).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'public:stats',
        result,
        300000,
      );
    });

    it('returns the cached stats when present', async () => {
      const cached = {
        totalBusinesses: 1,
        totalActiveDeals: 2,
        totalClaims: 3,
        totalBranches: 4,
      };
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.getStats();

      expect(result).toEqual(cached);
      expect(businessRepo.count).not.toHaveBeenCalled();
    });
  });
});
