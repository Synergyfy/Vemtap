import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import {
  LoyaltyProfile,
  TierLevel,
} from '../campaigns/entities/loyalty-profile.entity';
import { Reward } from '../campaigns/entities/reward.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { DevicesService } from '../devices/devices.service';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CampaignsService } from '../campaigns/campaigns.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let dataSource: DataSource;

  // --- Mocks for Repositories ---

  const mockLoyaltyProfileRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockRewardRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRedemptionRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockVisitRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  // Generic mock for getRepository used within the service
  const mockGenericRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  // --- Mocks for Services ---

  const mockDevicesService = {
    findByCode: jest.fn(),
  };

  const mockCampaignsService = {
    findActiveRule: jest.fn(),
    earnPoints: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn((entity) => mockGenericRepository),
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: getRepositoryToken(LoyaltyProfile),
          useValue: mockLoyaltyProfileRepository,
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: mockRewardRepository,
        },
        {
          provide: getRepositoryToken(PointTransaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Redemption),
          useValue: mockRedemptionRepository,
        },
        {
          provide: getRepositoryToken(Visit),
          useValue: mockVisitRepository, // Injecting the new Visit mock
        },
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
        {
          provide: CampaignsService,
          useValue: mockCampaignsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    jest.clearAllMocks();

    service = module.get<LoyaltyService>(LoyaltyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========================================================================
  // Unit Tests for Backend Updates
  // ========================================================================

  describe('getAnalytics', () => {
    it('should correctly calculate analytics including total visits from the Visit repository', async () => {
      const userId = 'user-123';
      
      // Mock profiles
      mockLoyaltyProfileRepository.find.mockResolvedValue([
        { business: { name: 'Venue A' }, totalPointsEarned: 1000, currentPointsBalance: 500 },
        { business: { name: 'Venue B' }, totalPointsEarned: 500, currentPointsBalance: 200 }
      ]);

      // Mock transactions (used for visitTrends calculation)
      mockTransactionRepository.createQueryBuilder().getMany.mockResolvedValue([
        { transactionType: 'earn', createdAt: new Date() },
        { transactionType: 'earn', createdAt: new Date() }
      ]);

      // Mock redemptions (used for netSavings calculation)
      mockRedemptionRepository.find.mockResolvedValue([
        { reward: { value: 50 } },
        { reward: { value: 25 } }
      ]);

      // NEW: Mock Visit repository count (Ensures visits are counted directly, not derived from points)
      mockVisitRepository.count.mockResolvedValue(15);

      const result = await service.getAnalytics(userId);

      // Verify that visitRepository.count was called with the correct userId
      expect(mockVisitRepository.count).toHaveBeenCalledWith({ where: { customerId: userId } });
      
      // Verify the returned structure matches expected analytics
      expect(result).toEqual(expect.objectContaining({
        totalVisits: 15, // Should match the mocked visit count
        currentPointsBalance: 700, // 500 + 200
        netSavings: 75, // 50 + 25
        pointsByVenue: [
          { venueName: 'Venue A', points: 1000 },
          { venueName: 'Venue B', points: 500 }
        ]
      }));
    });
  });

  describe('getProfile', () => {
    it('should return the loyalty profile along with the total visits for the specific business', async () => {
      const userId = 'user-123';
      const businessId = 'biz-456';
      
      const mockProfile = { id: 'prof-1', userId, businessId, tierLevel: TierLevel.BRONZE };
      
      mockLoyaltyProfileRepository.findOne.mockResolvedValue(mockProfile);
      
      // Mock visit count specifically for this user and business
      mockVisitRepository.count.mockResolvedValue(5);

      const result = await service.getProfile(userId, businessId);

      // Verify profile fetch
      expect(mockLoyaltyProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId, businessId },
        relations: ['transactions', 'redemptions'],
      });

      // Verify visit count scoped by businessId
      expect(mockVisitRepository.count).toHaveBeenCalledWith({
        where: { customerId: userId, businessId }
      });

      // Result should spread the profile and append totalVisits
      expect(result).toEqual({ ...mockProfile, totalVisits: 5 });
    });
  });

  describe('processTap', () => {
    it('should create a 0-point transaction when no active campaigns exist to ensure visit visibility in history', async () => {
      const userId = 'user-123';
      const deviceCode = 'DEV-001';
      
      // Setup base mocks for processTap
      const mockDevice = { id: 'dev-1', code: deviceCode, status: DeviceStatus.ACTIVE, businessId: 'biz-1', branchId: 'br-1', totalScans: 0 };
      const mockUser = { id: userId, email: 'test@test.com', phone: '1234' };
      const mockProfile = { id: 'prof-1', userId, businessId: 'biz-1' };
      
      mockGenericRepository.findOne.mockResolvedValueOnce(mockDevice); // Device find
      mockGenericRepository.findOneBy.mockResolvedValue(mockUser); // User find
      mockGenericRepository.findOne.mockResolvedValueOnce(null); // Contact find
      mockLoyaltyProfileRepository.findOne.mockResolvedValue(mockProfile); // Profile find
      
      // CRITICAL: Simulate NO active rules (meaning no points will be earned)
      mockCampaignsService.findActiveRule.mockResolvedValue(null);
      
      // Mock creation and saving
      mockGenericRepository.create.mockImplementation(data => data);
      mockGenericRepository.save.mockResolvedValue(true);
      mockTransactionRepository.create.mockImplementation(data => data);
      mockTransactionRepository.save.mockResolvedValue(true);

      await service.processTap(userId, deviceCode);

      // Verify a 0-point transaction was created to record the visit
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        loyaltyProfileId: mockProfile.id,
        transactionType: 'earn',
        pointsAmount: 0,
        reason: 'Visit recorded (No points)'
      }));
      
      expect(mockTransactionRepository.save).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should fetch and aggregate transactions, redemptions, and visits into a unified, sorted history', async () => {
      const userId = 'user-123';
      
      const mockTransactions = [
        { id: 'tx-1', transactionType: 'earn', pointsAmount: 50, reason: 'Earned', createdAt: new Date('2023-01-05'), loyaltyProfile: { business: { name: 'Biz A' } } }
      ];
      const mockRedemptions = [
        { id: 'red-1', pointsSpent: 100, reward: { name: 'Free Coffee' }, status: 'verified', createdAt: new Date('2023-01-10'), loyaltyProfile: { business: { name: 'Biz B' } } }
      ];
      const mockVisits = [
        { id: 'vis-1', createdAt: new Date('2023-01-01'), business: { name: 'Biz C' } }
      ];

      // Setup queries to return mock data
      mockTransactionRepository.createQueryBuilder().getMany.mockResolvedValue(mockTransactions);
      mockRedemptionRepository.createQueryBuilder().getMany.mockResolvedValue(mockRedemptions);
      mockVisitRepository.createQueryBuilder().getMany.mockResolvedValue(mockVisits);

      const result = await service.getHistory(userId);

      // Verify all three repositories were queried
      expect(mockTransactionRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockRedemptionRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockVisitRepository.createQueryBuilder).toHaveBeenCalled();

      // Expect 3 total items in the unified feed
      expect(result.length).toBe(3);

      // Verify Mapping logic: Redemptions mapped to 'reward_claim'
      expect(result.find(item => item.id === 'red-1')).toMatchObject({
        type: 'reward_claim',
        pointsAmount: -100, // Converted to negative
        reason: 'Claimed Free Coffee',
        businessName: 'Biz B'
      });

      // Verify Mapping logic: Visits mapped to 'visit' with 0 points
      expect(result.find(item => item.id === 'vis-1')).toMatchObject({
        type: 'visit',
        pointsAmount: 0,
        businessName: 'Biz C'
      });

      // Verify Sorting: Should be sorted by date descending (Newest first)
      // red-1 (Jan 10) -> tx-1 (Jan 5) -> vis-1 (Jan 1)
      expect(result[0].id).toBe('red-1');
      expect(result[1].id).toBe('tx-1');
      expect(result[2].id).toBe('vis-1');
    });
  });
});
