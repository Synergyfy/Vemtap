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

  const mockBranchRepository = {
    findOne: jest.fn().mockResolvedValue(mockBranch),
    save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
  };

  const mockVisitRepository = {
    createQueryBuilder: jest.fn(() => ({
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
    })),
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
        {
          provide: getRepositoryToken(Visit),
          useValue: mockVisitRepository,
        },
        {
          provide: getRepositoryToken(Partnership),
          useValue: mockPartnershipRepository,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: mockOfferRepository,
        },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview stats and highlights', async () => {
      const result = await service.getOverview('branch-1');
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.highlights).toBeDefined();
      expect(result.recentVisits).toBeDefined();
      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({ where: { id: 'branch-1' } });
    });

    it('should throw NotFoundException if branch does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getOverview('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSettings', () => {
    it('should return branch settings', async () => {
      const result = await service.getSettings('branch-1');
      expect(result).toEqual(mockBranch);
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const updates = { joinDiscoveryNetwork: false, smsAlerts: true };
      const result = await service.updateSettings('branch-1', updates);
      expect(result.joinDiscoveryNetwork).toBe(false);
      expect(result.smsAlerts).toBe(true);
    });
  });
});
