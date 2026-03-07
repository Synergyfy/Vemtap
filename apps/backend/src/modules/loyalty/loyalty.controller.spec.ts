import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { User, UserRole } from '../users/entities/user.entity';

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

  it('should get rewards', async () => {
    const result = [];
    mockLoyaltyService.getRewards.mockResolvedValue(result);
    expect(await controller.getRewards({ branchId: 'branch-1' }, mockReq)).toBe(
      result,
    );
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
