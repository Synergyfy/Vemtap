import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RewardTemplate } from './entities/reward-template.entity';
import { Reward } from './entities/reward.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { PointCode } from './entities/point-code.entity';
import { RedemptionCode } from './entities/redemption-code.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { BranchesService } from '../branches/branches.service';
import { DataSource } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((entity) => Promise.resolve({ id: '1', ...entity })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ sum: '0' }),
    })),
  };

  const mockBranchesService = {
    checkBranchAccess: jest.fn(),
    findById: jest.fn(),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: getRepositoryToken(RewardTemplate),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PointTransaction),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PointCode),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RedemptionCode),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Visit),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(LoyaltyRule),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepository,
        },
        {
          provide: BranchesService,
          useValue: mockBranchesService,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                save: jest.fn(),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBusinessPoints', () => {
    it('should return point balance', async () => {
      const result = await service.getBusinessPoints('u1', 'biz1');
      expect(result).toBe(0);
    });
  });

  describe('getPublicRewards', () => {
    it('should require branchId or branchCode', async () => {
      await expect(service.getPublicRewards({})).rejects.toThrow(
        'Branch ID or Code is required',
      );
    });

    it('should throw NotFoundException if branchCode is invalid', async () => {
      const mockBranchRepo = module.get(getRepositoryToken(Branch));
      jest.spyOn(mockBranchRepo, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.getPublicRewards({ branchCode: 'INVALID' }),
      ).rejects.toThrow('Branch not found');
    });

    it('should call findAndCount with correct default params', async () => {
      const mockBranchRepo = module.get(getRepositoryToken(Branch));
      jest
        .spyOn(mockBranchRepo, 'findOne')
        .mockResolvedValueOnce({ id: 'branch-123' } as any);

      const mockRewardRepo = module.get(getRepositoryToken(Reward));
      jest.spyOn(mockRewardRepo, 'findAndCount').mockResolvedValueOnce([[], 0]);

      await service.getPublicRewards({ branchCode: 'CODE123' });

      expect(mockRewardRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ branchId: 'branch-123' }),
          ]),
          order: { createdAt: 'DESC' },
          take: 10,
          skip: 0,
        }),
      );
    });

    it('should map search and sort filters correctly', async () => {
      const mockRewardRepo = module.get(getRepositoryToken(Reward));
      jest.spyOn(mockRewardRepo, 'findAndCount').mockResolvedValueOnce([[], 0]);

      await service.getPublicRewards({
        branchId: 'branch-123',
        search: 'Coffee',
        lowestPoints: true,
        page: 2,
        limit: 5,
      });

      expect(mockRewardRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({
              branchId: 'branch-123',
              name: expect.anything(),
            }),
          ]),
          order: { pointsRequired: 'ASC' },
          take: 5,
          skip: 5,
        }),
      );
    });

    it('should handle infinity quantity in where clause', async () => {
      const mockRewardRepo = module.get(getRepositoryToken(Reward));
      jest.spyOn(mockRewardRepo, 'findAndCount').mockResolvedValueOnce([[], 0]);

      await service.getPublicRewards({ branchId: 'branch-123' });

      expect(mockRewardRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            expect.objectContaining({ remainingQuantity: expect.anything() }),
            expect.objectContaining({ totalQuantity: -1 }),
          ],
        }),
      );
    });
  });

  describe('generateRedemptionCode', () => {
    it('should allow generating code for infinity rewards even if remaining is 0', async () => {
      const mockUser = { id: 'u1', role: 'admin' } as any;
      const mockReward = {
        id: 'r1',
        branchId: 'b1',
        totalQuantity: -1,
        remainingQuantity: 0,
        expiryDate: new Date(Date.now() + 86400000),
      } as any;

      mockBranchesService.checkBranchAccess.mockResolvedValue(true);
      const mockRewardRepo = module.get(getRepositoryToken(Reward));
      jest.spyOn(mockRewardRepo, 'findOne').mockResolvedValue(mockReward);

      const result = await service.generateRedemptionCode(mockUser, {
        rewardId: 'r1',
        branchId: 'b1',
      });
      expect(result).toBeDefined();
    });

    it('should throw error for out of stock rewards if totalQuantity is not -1', async () => {
      const mockUser = { id: 'u1', role: 'admin' } as any;
      const mockReward = {
        id: 'r1',
        branchId: 'b1',
        totalQuantity: 10,
        remainingQuantity: 0,
        expiryDate: new Date(Date.now() + 86400000),
      } as any;

      mockBranchesService.checkBranchAccess.mockResolvedValue(true);
      const mockRewardRepo = module.get(getRepositoryToken(Reward));
      jest.spyOn(mockRewardRepo, 'findOne').mockResolvedValue(mockReward);

      await expect(
        service.generateRedemptionCode(mockUser, {
          rewardId: 'r1',
          branchId: 'b1',
        }),
      ).rejects.toThrow('Reward out of stock');
    });
  });
});
