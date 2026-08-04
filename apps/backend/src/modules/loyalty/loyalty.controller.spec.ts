import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { UserRole } from '../users/entities/user.entity';

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: LoyaltyService;

  const mockLoyaltyService = {
    getBusinessPoints: jest.fn(),
    getCustomerPoints: jest.fn(),
    getPointLogs: jest.fn(),
    getBusinessPointLogs: jest.fn(),
    givePoints: jest.fn(),
    generatePointCode: jest.fn(),
    usePointCode: jest.fn(),
    createTemplate: jest.fn(),
    getTemplates: jest.fn(),
    createReward: jest.fn(),
    getBranchRewards: jest.fn(),
    updateReward: jest.fn(),
    deleteReward: jest.fn(),
    generateRedemptionCode: jest.fn(),
    redeemReward: jest.fn(),
    redeemRewardById: jest.fn(),
    verifyRedemption: jest.fn(),
    applyTemplate: jest.fn(),
    getCustomerAnalytics: jest.fn(),
  };

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

  const mockUser = { id: 'u1', role: UserRole.CUSTOMER };
  const mockReq = { user: mockUser };

  describe('getBalance', () => {
    it('should call getBusinessPoints', async () => {
      const businessId = 'biz-1';
      await controller.getBalance(mockReq as any, businessId);
      expect(service.getCustomerPoints).toHaveBeenCalledWith(
        mockUser.id,
        businessId,
      );
    });
  });

  describe('getMyLogs', () => {
    it('should call getPointLogs', async () => {
      await controller.getMyLogs(mockReq as any, {
        businessId: 'biz-1',
        page: 1,
        limit: 10,
      });
      expect(service.getPointLogs).toHaveBeenCalledWith(
        mockUser.id,
        'biz-1',
        1,
        10,
      );
    });
  });

  describe('givePoints', () => {
    it('should call givePoints', async () => {
      const dto = { uniqueCode: 'code-1', points: 10, businessId: 'biz-1' };
      await controller.givePoints(mockReq as any, dto as any);
      expect(service.givePoints).toHaveBeenCalledWith(mockUser, dto);
    });
  });

  it('calls direct reward redemption for the authenticated customer', async () => {
    const dto = { rewardId: 'reward-1' };
    await controller.redeemRewardById(mockReq as any, dto);
    expect(service.redeemRewardById).toHaveBeenCalledWith(mockUser, dto);
  });

  it('calls redemption verification for staff', async () => {
    const staffReq = { user: { id: 'staff-1', role: UserRole.STAFF } };
    const dto = { code: '123456789' };
    await controller.verifyRedemption(staffReq as any, dto);
    expect(service.verifyRedemption).toHaveBeenCalledWith(staffReq.user, dto);
  });
});
