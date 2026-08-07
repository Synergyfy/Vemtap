import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FosBudgetsService } from './fos-budgets.service';
import { Budget, BudgetPeriodType } from './entities/budget.entity';
import { FinancialTransaction } from '../fos-core/entities/financial-transaction.entity';

describe('FosBudgetsService', () => {
  let service: FosBudgetsService;

  const mockBudgetRepo = {
    create: jest.fn((data: Partial<Budget>) => data),
    save: jest.fn((data: Partial<Budget>) => ({ id: 'bud_001', ...data })),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockTransactionRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosBudgetsService,
        { provide: getRepositoryToken(Budget), useValue: mockBudgetRepo },
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<FosBudgetsService>(FosBudgetsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a budget with achievement percentages', async () => {
    mockTransactionRepo.find.mockResolvedValue([
      { type: 'SUBSCRIPTION', amount: '1500000', profit: '750000' },
      { type: 'SMS', amount: '1500000', profit: '700000' },
    ]);

    const result = await service.create({
      periodType: BudgetPeriodType.MONTHLY,
      targetRevenue: 3000000,
      targetBusinesses: 350,
      targetSmsUsage: 1500000,
      targetProfit: 1500000,
      startDate: '2026-06-18',
      endDate: '2026-07-18',
    });

    expect(result.id).toBe('bud_001');
    expect(result.targetRevenue).toBe(3000000);
    expect(result.achievedRevenuePercentage).toBe(100);
    expect(result.achievedProfitPercentage).toBeCloseTo(96.67, 1);
  });

  it('should return empty list when no budgets exist', async () => {
    mockBudgetRepo.find.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
  });
});
