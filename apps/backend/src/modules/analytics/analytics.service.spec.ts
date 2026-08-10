import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';
import { Device } from '../devices/entities/device.entity';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { PointTransaction } from '../loyalty/entities/point-transaction.entity';
import { RedemptionCode } from '../loyalty/entities/redemption-code.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Message } from '../messaging/entities/message.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { DataSource } from 'typeorm';

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
        {
          provide: getRepositoryToken(Device),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(MessageLog),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PointTransaction),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RedemptionCode),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockUser = { id: 'u1', branchId: 'b1', businessId: 'biz1' } as User;

  describe('getDashboardAnalytics', () => {
    it('should return dashboard analytics data', async () => {
      const result = await service.getDashboardAnalytics(mockUser, 'b1');
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
      const result = await service.getFootfallAnalytics(mockUser, 'b1');
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.hourlyData).toBeDefined();
      expect(result.trafficByEntrance).toBeDefined();
    });
  });

  describe('getPeakTimesAnalytics', () => {
    it('should return peak times analytics data', async () => {
      const result = await service.getPeakTimesAnalytics(mockUser, 'b1');
      expect(result).toBeDefined();
      expect(result.weeklyData).toBeDefined();
      expect(result.hoursLabels).toBeDefined();
      expect(result.smartSuggestion).toBeDefined();
    });
  });
  describe('getAdminSummary', () => {
    it('should return admin summary with statistics and trends', async () => {
      const result = await service.getAdminSummary();
      expect(result).toBeDefined();
      expect(result.stats).toHaveLength(4);
      expect(result.monthlyData).toBeDefined();
      expect(result.sectorSplit).toBeDefined();
      expect(result.securityAlerts).toBeDefined();
    });
  });
});
