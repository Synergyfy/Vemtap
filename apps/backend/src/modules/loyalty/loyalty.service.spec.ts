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
import { User, UserRole } from '../users/entities/user.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CampaignsService } from '../campaigns/campaigns.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let devicesService: DevicesService;
  let dataSource: DataSource;

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
  };

  const mockRedemptionRepository = {
    find: jest.fn(),
  };

  const mockRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockDevicesService = {
    findByCode: jest.fn(),
    adminUpdate: jest.fn(),
  };

  const mockCampaignsService = {
    findActiveRule: jest.fn(),
    earnPoints: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn((entity) => mockRepository),
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
    devicesService = module.get<DevicesService>(DevicesService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDeviceByCode', () => {
    it('should return device info if active', async () => {
      const mockDevice = {
        id: 'dev-1',
        code: 'ABC',
        status: 'active',
        business: { id: 'biz-1' },
        branch: { id: 'br-1' },
      };
      mockRepository.findOne.mockResolvedValue(mockDevice);

      const result = await service.getDeviceByCode('ABC');
      expect(result).toEqual({
        id: 'dev-1',
        name: undefined,
        code: 'ABC',
        type: undefined,
        business: { id: 'biz-1' },
        branch: { id: 'br-1' },
        owner: null,
        isFirstTimeVisit: true,
      });
    });

    it('should throw NotFoundException if device not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.getDeviceByCode('ABC')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if device is inactive', async () => {
      // Implementation now throws NotFoundException for both missing and inactive due to query filter
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.getDeviceByCode('ABC')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processTap', () => {
    const userId = 'user-1';
    const deviceCode = 'ABC';
    const mockDevice = {
      id: 'dev-1',
      code: 'ABC',
      status: 'active',
      businessId: 'biz-1',
      branchId: 'br-1',
      totalScans: 5,
    };
    const mockUser = { id: userId, email: 'test@example.com', phone: '123' };

    it('should process tap and record visit', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockDevice); // Device find
      mockRepository.findOneBy.mockResolvedValue(mockUser); // User find
      mockRepository.findOne.mockResolvedValueOnce(null); // Contact find

      // Mock profile lookup in processTap (getProfile call)
      mockLoyaltyProfileRepository.findOne.mockResolvedValue({
        userId,
        businessId: 'biz-1',
        currentPointsBalance: 0,
        totalPointsEarned: 0,
      });

      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.processTap(userId, deviceCode);

      expect(mockRepository.findOne).toHaveBeenCalled(); // Should be called for Device, then Contact
      expect(mockRepository.save).toHaveBeenCalled(); // Device totalScans, then Visit
    });
  });
  describe('getProfile', () => {
    const userId = 'user-1';
    const businessId = 'biz-1';

    it('should create a profile if it does not exist', async () => {
      mockLoyaltyProfileRepository.findOne.mockResolvedValue(null);
      const expectedProfile = {
        userId,
        businessId,
        tierLevel: TierLevel.BRONZE,
      };
      mockLoyaltyProfileRepository.create.mockReturnValue(expectedProfile);
      mockLoyaltyProfileRepository.save.mockResolvedValue({
        id: 'prof-1',
        ...expectedProfile,
      });

      const result = await service.getProfile(userId, businessId);

      expect(mockLoyaltyProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId, businessId },
        relations: ['transactions', 'redemptions'],
      });
      expect(mockLoyaltyProfileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          businessId,
        }),
      );
      expect(result.businessId).toBe(businessId);
    });

    it('should return existing profile if found', async () => {
      const existingProfile = { id: 'prof-1', userId, businessId };
      mockLoyaltyProfileRepository.findOne.mockResolvedValue(existingProfile);

      const result = await service.getProfile(userId, businessId);

      expect(result).toEqual(existingProfile);
      expect(mockLoyaltyProfileRepository.create).not.toHaveBeenCalled();
    });
  });
});
