import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: 0 }),
      getRawMany: jest.fn().mockResolvedValue([]),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Visit),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockUser = { id: 'u1' } as any;

  describe('getDashboardAnalytics', () => {
    it('should return dashboard analytics data', async () => {
      // Mock resolveBusinessContext to avoid deep mocking
      jest
        .spyOn(service as any, 'resolveBusinessContext')
        .mockResolvedValue({ resolvedBranchId: 'b1' });
      mockRepository.count.mockResolvedValue(10);

      const result = await service.getDashboardAnalytics('b1', mockUser);
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.peakTimes).toBeDefined();
      expect(result.messagingRoi).toBeDefined();
      expect(result.engagementQuality).toBeDefined();
      expect(result.topPerformers).toBeDefined();
    });
  });

  describe('getFootfallAnalytics', () => {
    it('should return footfall analytics data', async () => {
      jest
        .spyOn(service as any, 'resolveBusinessContext')
        .mockResolvedValue({ resolvedBranchId: 'b1' });
      const result = await service.getFootfallAnalytics('b1', mockUser);
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.hourlyData).toBeDefined();
      expect(result.trafficByEntrance).toBeDefined();
      expect(result.visitDuration).toBeDefined();
    });
  });

  describe('getPeakTimesAnalytics', () => {
    it('should return peak times analytics data', async () => {
      jest
        .spyOn(service as any, 'resolveBusinessContext')
        .mockResolvedValue({ resolvedBranchId: 'b1' });
      const result = await service.getPeakTimesAnalytics('b1', mockUser);
      expect(result).toBeDefined();
      expect(result.weeklyData).toBeDefined();
      expect(result.hoursLabels).toBeDefined();
      expect(result.smartSuggestion).toBeDefined();
    });
  });
  describe('getAdminSummary', () => {
    it('should return admin summary with statistics and trends', async () => {
      // Mocking the repositories would be ideal here if this was a real DB test,
      // but to match the style of existing tests we check the structure.
      const result = await service.getAdminSummary();
      expect(result).toBeDefined();
      expect(result.stats).toHaveLength(4);
      expect(result.monthlyData).toBeDefined();
      expect(result.sectorSplit).toBeDefined();
      expect(result.securityAlerts).toBeDefined();
    });
  });
});
