import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { EarnPointsDto } from './dto/earn-points.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: LoyaltyService;

  const mockLoyaltyService = {
    getProfile: jest.fn(),
    getAllProfiles: jest.fn(),
    getHistory: jest.fn(),
    getRewards: jest.fn(),
    redeemReward: jest.fn(),
    earnPoints: jest.fn(),
    createReward: jest.fn(),
    getAnalytics: jest.fn(),
    processTap: jest.fn(),
  };

  const mockUser = { id: 'user-1', role: 'customer' };
  const mockReq = { user: mockUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        {
          provide: LoyaltyService,
          useValue: mockLoyaltyService,
        },
      ],
    }).compile();

    controller = module.get<LoyaltyController>(LoyaltyController);
    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return profile for specific business', async () => {
      const businessId = 'biz-1';
      const result = { id: 'profile-1', businessId };
      mockLoyaltyService.getProfile.mockResolvedValue(result);

      expect(await controller.getProfile(mockReq, businessId)).toBe(result);
      expect(mockLoyaltyService.getProfile).toHaveBeenCalledWith(
        mockUser.id,
        businessId,
      );
    });

    it('should return all profiles if no businessId', async () => {
      const result = [{ id: 'profile-1' }];
      mockLoyaltyService.getAllProfiles.mockResolvedValue(result);

      expect(await controller.getProfile(mockReq)).toBe(result);
      expect(mockLoyaltyService.getAllProfiles).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('getHistory', () => {
    it('should return history', async () => {
      const result = [{ id: 'tx-1' }];
      mockLoyaltyService.getHistory.mockResolvedValue(result);

      expect(await controller.getHistory(mockReq, 'biz-1')).toBe(result);
      expect(mockLoyaltyService.getHistory).toHaveBeenCalledWith(
        mockUser.id,
        'biz-1',
      );
    });
  });

  describe('getRewards', () => {
    it('should return rewards', async () => {
      const businessId = 'biz-1';
      const result = [{ id: 'reward-1' }];
      mockLoyaltyService.getRewards.mockResolvedValue(result);

      expect(await controller.getRewards(businessId)).toBe(result);
      expect(mockLoyaltyService.getRewards).toHaveBeenCalledWith(businessId);
    });
  });

  describe('redeemReward', () => {
    it('should redeem a reward', async () => {
      const dto: RedeemRewardDto = { rewardId: 'rew-1' };
      const businessId = 'biz-1';
      const result = { id: 'redemption-1' };
      mockLoyaltyService.redeemReward.mockResolvedValue(result);

      expect(await controller.redeemReward(mockReq, dto, businessId)).toBe(
        result,
      );
      expect(mockLoyaltyService.redeemReward).toHaveBeenCalledWith(
        mockUser.id,
        businessId,
        dto.rewardId,
      );
    });
  });

  describe('earnPoints', () => {
    it('should add points', async () => {
      const dto: EarnPointsDto = { userId: 'u-1', amount: 100 };
      const businessId = 'biz-1';
      const result = { id: 'profile-1', points: 100 };
      mockLoyaltyService.earnPoints.mockResolvedValue(result);

      expect(await controller.earnPoints(dto, businessId)).toBe(result);
      expect(mockLoyaltyService.earnPoints).toHaveBeenCalledWith(
        businessId,
        dto,
      );
    });
  });

  describe('createReward', () => {
    it('should create a reward', async () => {
      const dto: CreateRewardDto = { name: 'Test Reward', pointCost: 100 };
      const businessId = 'biz-1';
      const result = { id: 'reward-1', ...dto };
      mockLoyaltyService.createReward.mockResolvedValue(result);

      expect(await controller.createReward(dto, businessId)).toBe(result);
      expect(mockLoyaltyService.createReward).toHaveBeenCalledWith(
        businessId,
        dto,
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const result = { totalVisits: 10 };
      mockLoyaltyService.getAnalytics.mockResolvedValue(result);
      expect(await controller.getAnalytics(mockReq)).toBe(result);
      expect(mockLoyaltyService.getAnalytics).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('tap', () => {
    it('should process a tap', async () => {
      const code = 'abc-123';
      const result = { id: 'profile-1' };
      mockLoyaltyService.processTap.mockResolvedValue(result);
      expect(await controller.tap(mockReq, code)).toBe(result);
      expect(mockLoyaltyService.processTap).toHaveBeenCalledWith(
        mockUser.id,
        code,
      );
    });
  });
});
