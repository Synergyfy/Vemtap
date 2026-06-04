import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FosFinancialPlanningService } from './fos-financial-planning.service';
import { FinancialTarget, TargetPeriodType } from './entities/financial-target.entity';
import {
  FinancialTransaction,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';

describe('FosFinancialPlanningService', () => {
  let service: FosFinancialPlanningService;
  let targetRepo: Repository<FinancialTarget>;
  let transactionRepo: Repository<FinancialTransaction>;

  const mockTargetRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockTransactionRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosFinancialPlanningService,
        {
          provide: getRepositoryToken(FinancialTarget),
          useValue: mockTargetRepo,
        },
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    service = module.get<FosFinancialPlanningService>(
      FosFinancialPlanningService,
    );
    targetRepo = module.get<Repository<FinancialTarget>>(
      getRepositoryToken(FinancialTarget),
    );
    transactionRepo = module.get<Repository<FinancialTransaction>>(
      getRepositoryToken(FinancialTransaction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTarget', () => {
    it('should create and return a target', async () => {
      const dto = {
        periodType: TargetPeriodType.MONTHLY,
        targetRevenue: 5000000,
        targetBusinesses: 500,
        targetSmsUsage: 10000,
        targetEmailUsage: 5000,
        profitMargin: 30,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };

      const savedEntity = {
        id: 'target-1',
        ...dto,
        createdAt: new Date(),
      };

      mockTargetRepo.create.mockReturnValue(savedEntity);
      mockTargetRepo.save.mockResolvedValue(savedEntity);
      mockTransactionRepo.find.mockResolvedValue([]);

      const result = await service.createTarget(dto);

      expect(result.id).toBe('target-1');
      expect(result.achievedRevenuePercentage).toBe(0);
      expect(mockTargetRepo.create).toHaveBeenCalled();
      expect(mockTargetRepo.save).toHaveBeenCalled();
    });
  });

  describe('getTargets', () => {
    it('should return filtered targets', async () => {
      const targets = [
        {
          id: 'target-1',
          periodType: TargetPeriodType.MONTHLY,
          targetRevenue: 5000000,
          targetBusinesses: 500,
          targetSmsUsage: 10000,
          targetEmailUsage: 5000,
          profitMargin: 30,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdAt: new Date(),
        },
      ];

      mockTargetRepo.find.mockResolvedValue(targets);
      mockTransactionRepo.find.mockResolvedValue([]);

      const result = await service.getTargets({});

      expect(result).toHaveLength(1);
      expect(result[0].periodType).toBe(TargetPeriodType.MONTHLY);
    });

    it('should filter by period type', async () => {
      mockTargetRepo.find.mockResolvedValue([]);

      await service.getTargets({ periodType: TargetPeriodType.WEEKLY });

      expect(mockTargetRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { periodType: TargetPeriodType.WEEKLY },
        }),
      );
    });
  });

  describe('simulateScenario', () => {
    it('should return best/expected/worst scenarios', async () => {
      const dto = {
        currentBusinesses: 100,
        growthRate: 10,
        churnRate: 5,
        pricing: 5000,
        agentFactor: 1.5,
        projectionMonths: 12,
        profitMargin: 30,
      };

      const result = await service.simulateScenario(dto);

      expect(result.best).toBeDefined();
      expect(result.expected).toBeDefined();
      expect(result.worst).toBeDefined();
      expect(result.best.monthlyBreakdown.length).toBe(12);
      expect(result.expected.monthlyBreakdown.length).toBe(12);
      expect(result.worst.monthlyBreakdown.length).toBe(12);
      expect(result.best.totalProfit).toBeGreaterThan(result.expected.totalProfit);
      expect(result.expected.totalProfit).toBeGreaterThan(result.worst.totalProfit);
    });

    it('should handle single month projection', async () => {
      const dto = {
        currentBusinesses: 100,
        growthRate: 10,
        churnRate: 5,
        pricing: 5000,
        agentFactor: 1,
        projectionMonths: 1,
        profitMargin: 30,
      };

      const result = await service.simulateScenario(dto);

      expect(result.best.monthlyBreakdown.length).toBe(1);
      expect(result.expected.monthlyBreakdown.length).toBe(1);
      expect(result.worst.monthlyBreakdown.length).toBe(1);
    });
  });
});
