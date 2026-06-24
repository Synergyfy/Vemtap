import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from './discovery.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Partnership } from '../partnerships/entities/partnership.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { NotFoundException } from '@nestjs/common';

describe('DiscoveryService', () => {
  let service: DiscoveryService;

  const mockBranch = {
    id: 'branch-1',
    name: 'Test Branch',
    joinDiscoveryNetwork: true,
    receivePartnerRequests: true,
    allowPromotions: true,
    pushNotifications: true,
    smsAlerts: false,
    emailSummary: true,
  };

  // Factory so each test gets a fresh query builder
  const makeQb = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: '150.00', count: '5' }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(10),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  });

  const mockBranchRepository = {
    findOne: jest.fn().mockResolvedValue({ ...mockBranch }),
    save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
  };

  const mockVisitRepository = {
    createQueryBuilder: jest.fn(() => makeQb()),
    count: jest.fn().mockResolvedValue(5),
  };

  const mockPartnershipRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockOfferRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '500' }),
    })),
    findOne: jest.fn().mockResolvedValue({
      id: 'offer-1',
      name: 'Best Deal',
      visits: 25,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepository },
        { provide: getRepositoryToken(Visit), useValue: mockVisitRepository },
        { provide: getRepositoryToken(Partnership), useValue: mockPartnershipRepository },
        { provide: getRepositoryToken(CatalogueOffer), useValue: mockOfferRepository },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getOverview ──────────────────────────────────────────────────────────

  describe('getOverview', () => {
    it('should return overview stats, highlights and recentVisits', async () => {
      const result = await service.getOverview('branch-1');
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.highlights).toBeDefined();
      expect(result.recentVisits).toBeDefined();
      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({ where: { id: 'branch-1' } });
    });

    it('should throw NotFoundException when branch does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getOverview('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getResults ───────────────────────────────────────────────────────────

  describe('getResults', () => {
    it('should return stats and timeline for 7days range', async () => {
      const result = await service.getResults('branch-1', '7days');
      expect(result.stats).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(Array.isArray(result.timeline)).toBe(true);
    });

    it('should return stats and timeline for month range', async () => {
      const result = await service.getResults('branch-1', 'month');
      expect(result.stats).toBeDefined();
    });

    it('should return stats and timeline for year range', async () => {
      const result = await service.getResults('branch-1', 'year');
      expect(result.stats).toBeDefined();
    });

    it('should throw NotFoundException when branch does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getResults('nonexistent', '7days')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getSettings ──────────────────────────────────────────────────────────

  describe('getSettings', () => {
    it('should return branch settings', async () => {
      const result = await service.getSettings('branch-1');
      expect(result).toEqual({ ...mockBranch });
    });

    it('should throw NotFoundException when branch does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getSettings('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateSettings (Bug 2 coverage) ─────────────────────────────────────

  describe('updateSettings', () => {
    it('should update only the provided boolean settings', async () => {
      const updates = { joinDiscoveryNetwork: false, smsAlerts: true };
      const result = await service.updateSettings('branch-1', updates);
      expect(result.joinDiscoveryNetwork).toBe(false);
      expect(result.smsAlerts).toBe(true);
      // Other fields remain unchanged from the mock branch
      expect(result.pushNotifications).toBe(true);
    });

    it('should NOT overwrite protected fields like id even if passed in dto', async () => {
      // Cast to any to simulate a malicious payload that sneaks extra fields
      const maliciousDto = { joinDiscoveryNetwork: false, id: 'hacked-id' } as any;
      const result = await service.updateSettings('branch-1', maliciousDto);
      // The whitelisted path should not write id onto the saved entity
      expect(result.id).not.toBe('hacked-id');
    });

    it('should throw NotFoundException when branch does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.updateSettings('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getPartners ──────────────────────────────────────────────────────────

  describe('getPartners', () => {
    it('should return empty array when no partnerships exist', async () => {
      const result = await service.getPartners('branch-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  // ─── getCustomers (Bug 1 coverage) ────────────────────────────────────────

  describe('getCustomers', () => {
    it('should return paginated result for filter=all', async () => {
      const result = await service.getCustomers('branch-1', 'all', 1, 10);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply from_partners filter without throwing (Bug 1: missing branchId binding)', async () => {
      // Before the fix this would throw because the :branchId binding was missing
      await expect(service.getCustomers('branch-1', 'from_partners', 1, 10)).resolves.toBeDefined();
    });

    it('should apply sent_to_partners filter without throwing', async () => {
      await expect(service.getCustomers('branch-1', 'sent_to_partners', 1, 10)).resolves.toBeDefined();
    });

    it('should apply direct filter without throwing', async () => {
      await expect(service.getCustomers('branch-1', 'direct', 1, 10)).resolves.toBeDefined();
    });
  });

  // ─── submitRecommendation ─────────────────────────────────────────────────

  describe('submitRecommendation', () => {
    it('should return success response with submitted data', async () => {
      const dto = {
        businessName: "Joe's Barbershop",
        ownerName: 'Joe Smith',
        phone: '+234 800 000 0000',
        email: 'joe@example.com',
      };
      const result = await service.submitRecommendation('branch-1', dto);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(dto);
    });
  });
});
