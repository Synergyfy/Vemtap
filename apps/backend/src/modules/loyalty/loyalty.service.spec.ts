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
import { DataSource } from 'typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { CampaignsService } from '../campaigns/campaigns.service';
import { DeviceStatus } from '../devices/entities/device.entity';
import { BranchesService } from '../branches/branches.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

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

  const mockGenericRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockDevicesService = {
    findByCode: jest.fn(),
  };

  const mockCampaignsService = {
    findActiveRule: jest.fn(),
    earnPoints: jest.fn(),
  };

  const mockBranchesService = {
    checkBranchAccess: jest.fn(),
    findById: jest.fn(),
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
          useValue: mockVisitRepository,
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
          provide: BranchesService,
          useValue: mockBranchesService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    jest.clearAllMocks();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalytics', () => {
    it('should correctly calculate analytics', async () => {
      const userId = 'user-123';

      mockLoyaltyProfileRepository.find.mockResolvedValue([
        {
          branchId: 'b1',
          totalPointsEarned: 1000,
          currentPointsBalance: 500,
          points: 500,
        },
      ]);

      mockVisitRepository.count.mockResolvedValue(15);

      const result = await service.getAnalytics(userId);

      expect(result.visitCount).toBe(15);
      expect(result.totalPoints).toBe(500);
    });
  });

  describe('getProfile', () => {
    it('should return loyalty profile for specific branch', async () => {
      const userId = 'user-123';
      const branchId = 'branch-456';

      const mockProfile = {
        id: 'prof-1',
        userId,
        branchId,
        tierLevel: TierLevel.BRONZE,
        currentPointsBalance: 500,
        points: 500,
      };

      mockLoyaltyProfileRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.getProfile(userId, branchId);

      expect(mockLoyaltyProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId, branchId },
      });

      expect(result.points).toBe(500);
    });
  });

  describe('processTap', () => {
    it('should call earnPoints via campaignsService on device tap', async () => {
      const userId = 'user-123';
      const deviceCode = 'DEV-001';

      const mockDevice = {
        id: 'dev-1',
        code: deviceCode,
        status: DeviceStatus.ACTIVE,
        branchId: 'branch-1',
        totalScans: 0,
      };

      mockDevicesService.findByCode.mockResolvedValue(mockDevice);
      mockCampaignsService.earnPoints.mockResolvedValue({ success: true });

      const result = await service.processTap(userId, deviceCode);

      expect(mockDevicesService.findByCode).toHaveBeenCalledWith(deviceCode);
      expect(mockCampaignsService.earnPoints).toHaveBeenCalledWith('branch-1', {
        userId,
        isVisit: true,
      });
      expect(result).toEqual({ success: true });
    });
  });
});
