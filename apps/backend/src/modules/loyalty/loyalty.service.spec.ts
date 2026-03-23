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
import { BranchesService } from '../branches/branches.service';
import { DataSource } from 'typeorm';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: '1', ...entity })),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
});
