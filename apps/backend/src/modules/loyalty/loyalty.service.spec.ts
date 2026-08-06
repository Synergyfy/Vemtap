import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RewardTemplate } from './entities/reward-template.entity';
import { Reward } from './entities/reward.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { PointCode } from './entities/point-code.entity';
import { RedemptionCode } from './entities/redemption-code.entity';
import { User, UserRole } from '../users/entities/user.entity';
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

  describe('givePoints', () => {
    it('resolves a customer by ID and scopes the award to an authorized branch', async () => {
      const branch = { id: 'b1', businessId: 'biz1' } as any;
      const customer = { id: 'customer-1', role: UserRole.CUSTOMER } as any;
      const branchRepo = module.get(getRepositoryToken(Branch));
      const userRepo = module.get(getRepositoryToken(User));
      const transactionRepo = module.get(getRepositoryToken(PointTransaction));

      jest.spyOn(branchRepo, 'findOne').mockResolvedValueOnce(branch);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(customer);
      mockBranchesService.checkBranchAccess.mockResolvedValueOnce(true);

      await service.givePoints({ id: 'staff-1' } as any, {
        customerId: customer.id,
        points: 25,
        branchId: branch.id,
      });

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: customer.id, role: UserRole.CUSTOMER },
      });
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: customer.id,
          businessId: branch.businessId,
          branchId: branch.id,
          amount: 25,
        }),
      );
    });
  });

  describe('applyTemplate', () => {
    it('creates a branch reward from a template', async () => {
      const templateRepo = module.get(getRepositoryToken(RewardTemplate));
      const rewardRepo = module.get(getRepositoryToken(Reward));
      const branchRepo = module.get(getRepositoryToken(Branch));
      const template = {
        id: 'template-1',
        name: 'Free Coffee',
        description: 'Coffee reward',
        pointsRequired: 50,
        category: 'free_product',
      } as any;
      const branch = { id: 'branch-1', businessId: 'business-1' } as any;

      mockBranchesService.checkBranchAccess.mockResolvedValueOnce(true);
      jest.spyOn(templateRepo, 'findOne').mockResolvedValueOnce(template);
      jest.spyOn(branchRepo, 'findOne').mockResolvedValueOnce(branch);

      await service.applyTemplate({ id: 'owner-1' } as any, template.id, {
        branchId: branch.id,
        totalQuantity: 10,
        expiryDate: '2030-01-01T00:00:00.000Z',
      });

      expect(rewardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: template.id,
          branchId: branch.id,
          businessId: branch.businessId,
          totalQuantity: 10,
          remainingQuantity: 10,
        }),
      );
    });
  });

  describe('verifyRedemption', () => {
    it('returns invalid for an unknown code without leaking tenant data', async () => {
      const redemptionRepo = module.get(getRepositoryToken(RedemptionCode));
      jest.spyOn(redemptionRepo, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.verifyRedemption({ id: 'staff-1' } as any, {
          code: 'unknown',
        }),
      ).resolves.toEqual({
        valid: false,
        code: 'unknown',
        reason: 'NOT_FOUND',
      });
    });
  });

  describe('earnForVisitor', () => {
    it('creates a customer from an email and awards visit points', async () => {
      const branch = { id: 'b1', businessId: 'biz1' } as any;
      const rule = {
        id: 'rule-1',
        isActive: true,
        visitPoints: 50,
        firstVisitBonus: 100,
        spendingBaseAmount: 10,
        spendingBasePoints: 1,
      } as any;
      const savedCustomer = {
        id: 'customer-1',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        uniqueCode: 'CUST-123456',
        role: UserRole.CUSTOMER,
      } as any;

      const findOne = mockRepository.findOne;
      findOne
        .mockResolvedValueOnce(branch) // resolveBranchByIdentifier
        .mockResolvedValueOnce(null) // identity lookup by email
        .mockResolvedValueOnce(null) // unique code generation
        .mockResolvedValueOnce(rule); // getRules
      mockRepository.save.mockResolvedValueOnce(savedCustomer);

      const result = await service.earnForVisitor({
        email: 'jane@example.com',
        branchId: 'b1',
        isVisit: true,
      });

      expect(result.success).toBe(true);
      expect(result.pointsEarned).toBe(150);
      expect(result.customer.uniqueCode).toBe('CUST-123456');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CUSTOMER,
          email: 'jane@example.com',
        }),
      );
    });

    it('throws when no identity is provided', async () => {
      const findOne = mockRepository.findOne;
      findOne.mockResolvedValueOnce({ id: 'b1', businessId: 'biz1' } as any);

      await expect(
        service.earnForVisitor({ branchId: 'b1', isVisit: true } as any),
      ).rejects.toThrow('At least one of email or phone');
    });

    it('rejects earning without a visit (no self-served points/spend)', async () => {
      await expect(
        service.earnForVisitor({
          branchId: 'b1',
          email: 'jane@example.com',
        } as any),
      ).rejects.toThrow('only supports visit-based earning');
    });

    it('rejects providing both branchId and branchCode', async () => {
      await expect(
        service.earnForVisitor({
          branchId: 'b1',
          branchCode: 'CODE123',
          email: 'jane@example.com',
          isVisit: true,
        } as any),
      ).rejects.toThrow('not both');
    });

    it('recovers from a concurrent unique-constraint race by re-fetching', async () => {
      const branch = { id: 'b1', businessId: 'biz1' } as any;
      const rule = {
        id: 'rule-1',
        isActive: true,
        visitPoints: 50,
        firstVisitBonus: 100,
      } as any;
      const existingCustomer = {
        id: 'customer-1',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        uniqueCode: 'CUST-123456',
        role: UserRole.CUSTOMER,
      } as any;

      const findOne = mockRepository.findOne;
      findOne
        .mockResolvedValueOnce(branch) // branch
        .mockResolvedValueOnce(null) // identity lookup
        .mockResolvedValueOnce(null) // unique code gen
        .mockResolvedValueOnce(existingCustomer) // re-fetch after collision
        .mockResolvedValueOnce(rule); // rule
      // First save collides on the unique constraint
      const save = mockRepository.save;
      save
        .mockRejectedValueOnce(
          new Error('duplicate key value violates unique constraint'),
        )
        .mockResolvedValueOnce(existingCustomer);

      const result = await service.earnForVisitor({
        email: 'jane@example.com',
        branchId: 'b1',
        isVisit: true,
      });

      expect(result.success).toBe(true);
      expect(result.customer.id).toBe('customer-1');
    });
  });

  describe('earnManualPoints', () => {
    const branch = { id: 'b1', businessId: 'biz1' } as any;
    const staff = { id: 'staff-1', role: UserRole.MANAGER } as any;
    const customer = {
      id: 'customer-1',
      role: UserRole.CUSTOMER,
      firstName: 'Jane',
      lastName: 'Doe',
      uniqueCode: 'CUST-123456',
    } as any;

    beforeEach(() => {
      mockBranchesService.checkBranchAccess.mockResolvedValue(true);
    });

    it('credits the customer and returns the award contract', async () => {
      const findOne = mockRepository.findOne;
      findOne
        .mockResolvedValueOnce(branch)
        .mockResolvedValueOnce(customer);

      mockRepository.create.mockClear();
      mockRepository.save.mockClear();
      mockRepository.save.mockResolvedValueOnce({
        id: 'abc-123-456',
      } as any);

      const result = await service.earnManualPoints(staff, 'b1', {
        userId: 'customer-1',
        points: 500,
      });

      expect(result).toMatchObject({
        success: true,
        pointsEarned: 500,
        newBalance: 0,
        message: '500 points awarded successfully',
        transactionId: 'txn-abc-123-456',
      });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500,
          type: 'earned',
          customerId: 'customer-1',
          givenById: 'staff-1',
          businessId: 'biz1',
          branchId: 'b1',
        }),
      );
      expect(mockBranchesService.checkBranchAccess).toHaveBeenCalledWith(
        staff,
        'b1',
      );
    });

    it('uses dto.awardedBy when provided', async () => {
      const findOne = mockRepository.findOne;
      findOne.mockResolvedValueOnce(branch).mockResolvedValueOnce(customer);
      mockRepository.save.mockResolvedValueOnce({ id: 'txn-123' } as any);

      await service.earnManualPoints(staff, 'b1', {
        userId: 'customer-1',
        points: 100,
        awardedBy: 'other-staff',
      });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ givenById: 'other-staff' }),
      );
    });

    it('throws NotFoundException when the branch is unknown', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.earnManualPoints(staff, 'b-missing', {
          userId: 'customer-1',
          points: 10,
        }),
      ).rejects.toThrow('Branch not found');
    });

    it('throws ForbiddenException when the user lacks branch access', async () => {
      mockBranchesService.checkBranchAccess.mockResolvedValue(false);
      mockRepository.findOne.mockResolvedValueOnce(branch);

      await expect(
        service.earnManualPoints(staff, 'b1', {
          userId: 'customer-1',
          points: 10,
        }),
      ).rejects.toThrow('You do not have access to this branch');
    });

    it('throws NotFoundException when the loyalty profile is unknown', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(branch)
        .mockResolvedValueOnce(null);

      await expect(
        service.earnManualPoints(staff, 'b1', {
          userId: 'customer-missing',
          points: 10,
        }),
      ).rejects.toThrow('Loyalty profile not found');
    });

    it('rejects non-positive points', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(branch)
        .mockResolvedValueOnce(customer);

      await expect(
        service.earnManualPoints(staff, 'b1', {
          userId: 'customer-1',
          points: 0,
        } as any),
      ).rejects.toThrow('points must be a positive number');
    });
  });
});
