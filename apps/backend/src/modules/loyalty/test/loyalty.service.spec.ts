import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from '../loyalty.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RewardTemplate } from '../entities/reward-template.entity';
import { Reward } from '../entities/reward.entity';
import { PointTransaction } from '../entities/point-transaction.entity';
import { PointCode } from '../entities/point-code.entity';
import { RedemptionCode } from '../entities/redemption-code.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { BranchesService } from '../../branches/branches.service';
import { DataSource } from 'typeorm';
import { LoyaltyRule } from '../entities/loyalty-rule.entity';
import { Business } from '../../businesses/entities/business.entity';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let rewardTemplateRepo: any;
  let rewardRepo: any;
  let pointTransactionRepo: any;
  let pointCodeRepo: any;
  let redemptionCodeRepo: any;
  let userRepo: any;
  let branchRepo: any;
  let visitRepo: any;

  const mockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
    })),
  });

  const mockBranchesService = {
    checkBranchAccess: jest.fn().mockResolvedValue(true),
    findById: jest.fn(),
  };

  const mockDataSource = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: getRepositoryToken(RewardTemplate), useFactory: mockRepo },
        { provide: getRepositoryToken(Reward), useFactory: mockRepo },
        { provide: getRepositoryToken(PointTransaction), useFactory: mockRepo },
        { provide: getRepositoryToken(PointCode), useFactory: mockRepo },
        { provide: getRepositoryToken(RedemptionCode), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(Branch), useFactory: mockRepo },
        { provide: getRepositoryToken(Visit), useFactory: mockRepo },
        { provide: getRepositoryToken(LoyaltyRule), useFactory: mockRepo },
        { provide: getRepositoryToken(Business), useFactory: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: BranchesService, useValue: mockBranchesService },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    rewardTemplateRepo = module.get(getRepositoryToken(RewardTemplate));
    rewardRepo = module.get(getRepositoryToken(Reward));
    pointTransactionRepo = module.get(getRepositoryToken(PointTransaction));
    pointCodeRepo = module.get(getRepositoryToken(PointCode));
    redemptionCodeRepo = module.get(getRepositoryToken(RedemptionCode));
    userRepo = module.get(getRepositoryToken(User));
    branchRepo = module.get(getRepositoryToken(Branch));
    visitRepo = module.get(getRepositoryToken(Visit));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBusinessPoints', () => {
    it('should return total points for a customer in a business', async () => {
      const qb = pointTransactionRepo.createQueryBuilder();
      qb.getRawOne.mockResolvedValue({ sum: '100' });
      pointTransactionRepo.createQueryBuilder.mockReturnValue(qb);

      const points = await service.getBusinessPoints('user1', 'biz1');
      expect(points).toBe(100);
      expect(qb.where).toHaveBeenCalledWith(
        'transaction.customerId = :userId',
        { userId: 'user1' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'transaction.businessId = :businessId',
        { businessId: 'biz1' },
      );
    });
  });

  describe('givePoints', () => {
    it('should create a point transaction when staff gives points', async () => {
      const staff = { id: 'staff1' } as User;
      const dto = { customerCode: 'CUST1', points: 10, branchId: 'branch1' };
      const customer = { id: 'cust1', role: UserRole.CUSTOMER } as User;
      const branch = { id: 'branch1', businessId: 'biz1' } as Branch;

      userRepo.findOne.mockResolvedValue(customer);
      branchRepo.findOne.mockResolvedValue(branch);
      pointTransactionRepo.create.mockReturnValue({
        ...dto,
        customerId: customer.id,
        businessId: 'biz1',
      });
      pointTransactionRepo.save.mockResolvedValue({ id: 'tx1' });

      const result = await service.givePoints(staff, dto);
      expect(result).toBeDefined();
      expect(pointTransactionRepo.save).toHaveBeenCalled();
    });

    it('should throw error if customer not found', async () => {
      branchRepo.findOne.mockResolvedValue({ id: 'Y', businessId: 'biz1' });
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.givePoints({} as User, {
          customerCode: 'X',
          points: 1,
          branchId: 'Y',
        }),
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('generatePointCode', () => {
    it('should generate a 9-digit code', async () => {
      const staff = { id: 'staff1', businessId: 'biz1' } as User;
      const dto = { points: 50, businessId: 'biz1' };
      pointCodeRepo.create.mockImplementation((d) => d);
      pointCodeRepo.save.mockImplementation((d) =>
        Promise.resolve({ ...d, id: 'pc1' }),
      );

      const result = await service.generatePointCode(staff, dto);
      expect(result.code).toHaveLength(9);
      expect(result.points).toBe(50);
    });
  });
});
