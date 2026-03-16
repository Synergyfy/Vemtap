import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { User, UserRole } from '../users/entities/user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BranchesService } from '../branches/branches.service';

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
    checkBranchAccess: jest.fn(),
    getBusinessLoyaltyStats: jest.fn(),
  };

  const mockSubscriptionsService = {
    getCapabilities: jest.fn(),
  };

  const mockBranchesService = {
    findOne: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    role: UserRole.OWNER,
    businessId: 'biz-1',
    branchId: 'branch-1',
  } as User;
  const mockReq = { user: mockUser };

  beforeEach(async () => {
    mockLoyaltyService.checkBranchAccess.mockResolvedValue(true);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        {
          provide: LoyaltyService,
          useValue: mockLoyaltyService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: BranchesService,
          useValue: mockBranchesService,
        },
      ],
    }).compile();

    controller = module.get<LoyaltyController>(LoyaltyController);
    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('should get profile', async () => {
    const result = { id: 'p1' };
    mockLoyaltyService.getProfile.mockResolvedValue(result);
    expect(await controller.getProfile(mockReq, { branchId: 'branch-1' })).toBe(
      result,
    );
  });

  it('should get history', async () => {
    const result = [];
    mockLoyaltyService.getHistory.mockResolvedValue(result);
    expect(await controller.getHistory(mockReq, { branchId: 'branch-1' })).toBe(
      result,
    );
  });

  it('should get rewards for a branch', async () => {
    const result = [];
    mockLoyaltyService.getRewards.mockResolvedValue(result);
    expect(await controller.getRewards({ branchId: 'branch-1' }, mockReq)).toBe(
      result,
    );
    expect(mockLoyaltyService.getRewards).toHaveBeenCalledWith('branch-1', undefined);
  });

  it('should get all rewards for OWNER if branchId is not provided', async () => {
    const result = [];
    mockLoyaltyService.getRewards.mockResolvedValue(result);
    // OWNER should be able to fetch all rewards without branchId
    expect(await controller.getRewards({ allBranches: true }, mockReq)).toBe(
      result,
    );
    expect(mockLoyaltyService.getRewards).toHaveBeenCalledWith(undefined, 'biz-1');

    // Default to allBranches if neither is provided for OWNER
    expect(await controller.getRewards({}, mockReq)).toBe(result);
    expect(mockLoyaltyService.getRewards).toHaveBeenCalledWith(undefined, 'biz-1');
  });

  it('should redeem reward', async () => {
    const dto = { rewardId: 'r1', loyaltyProfileId: 'lp1' };
    const result = { id: 'red1' };
    mockLoyaltyService.redeemReward.mockResolvedValue(result);
    expect(await controller.redeemReward(mockReq, dto as any, 'branch-1')).toBe(
      result,
    );
  });

  it('should earn points', async () => {
    const dto = { userId: 'u1', points: 100 };
    const result = { success: true };
    mockLoyaltyService.earnPoints.mockResolvedValue(result);
    expect(
      await controller.earnPoints(dto as any, mockReq, {
        branchId: 'branch-1',
      }),
    ).toBe(result);
  });

  it('should create reward', async () => {
    const dto = { name: 'Reward 1', pointsRequired: 100 };
    const result = { id: 'r1' };
    mockLoyaltyService.createReward.mockResolvedValue(result);
    expect(
      await controller.createReward(dto as any, mockReq, {
        branchId: 'branch-1',
      }),
    ).toBe(result);
  });
});
