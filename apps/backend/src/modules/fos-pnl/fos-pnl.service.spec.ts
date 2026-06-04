import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FosPnlService } from './fos-pnl.service';
import {
  FinancialTransaction,
  FosTransactionType,
  FosPlatform,
} from '../fos-core/entities/financial-transaction.entity';
import { MetricsSnapshot } from '../fos-dashboard/entities/metrics-snapshot.entity';

describe('FosPnlService', () => {
  let service: FosPnlService;
  let transactionRepo: Repository<FinancialTransaction>;
  let snapshotRepo: Repository<MetricsSnapshot>;

  const mockTransactionRepo = {
    find: jest.fn(),
  };

  const mockSnapshotRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosPnlService,
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepo,
        },
        {
          provide: getRepositoryToken(MetricsSnapshot),
          useValue: mockSnapshotRepo,
        },
      ],
    }).compile();

    service = module.get<FosPnlService>(FosPnlService);
    transactionRepo = module.get<Repository<FinancialTransaction>>(
      getRepositoryToken(FinancialTransaction),
    );
    snapshotRepo = module.get<Repository<MetricsSnapshot>>(
      getRepositoryToken(MetricsSnapshot),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBreakEven', () => {
    it('should compute break-even metrics from transactions', async () => {
      mockTransactionRepo.find.mockResolvedValue([
        {
          type: FosTransactionType.SUBSCRIPTION,
          platform: FosPlatform.VEMTAP,
          amount: '1000000',
          profit: '300000',
          cost: '0',
          businessId: 'biz-1',
        },
        {
          type: FosTransactionType.SUBSCRIPTION,
          platform: FosPlatform.QRTHRIVE,
          amount: '500000',
          profit: '200000',
          cost: '50000',
          businessId: 'biz-2',
        },
        {
          type: FosTransactionType.EXPENSE,
          platform: FosPlatform.VEMTAP,
          amount: '250000',
          profit: '0',
          cost: '250000',
          businessId: null,
        },
        {
          type: FosTransactionType.COMMISSION,
          platform: FosPlatform.VEMTAP,
          amount: '150000',
          profit: '0',
          cost: '150000',
          businessId: 'biz-1',
        },
      ]);

      const result = await service.getBreakEven();

      expect(result.grossRevenue).toBe(1500000);
      expect(result.monthlyFixedCosts).toBe(250000);
      expect(result.totalMonthlyCosts).toBe(400000);
      expect(result.activeBusinesses).toBe(2);
      expect(result.isProfitable).toBe(true);
    });

    it('should handle empty transactions', async () => {
      mockTransactionRepo.find.mockResolvedValue([]);

      const result = await service.getBreakEven();

      expect(result.grossRevenue).toBe(0);
      expect(result.activeBusinesses).toBe(1);
      expect(result.arpu).toBe(0);
      expect(result.isProfitable).toBe(false);
    });
  });

  describe('getRunway', () => {
    it('should compute runway from transactions', async () => {
      mockTransactionRepo.find.mockResolvedValue([
        {
          type: FosTransactionType.SUBSCRIPTION,
          amount: '1000000',
          cost: '0',
          profit: '300000',
        },
        {
          type: FosTransactionType.SMS,
          amount: '500000',
          cost: '50000',
          profit: '200000',
        },
        {
          type: FosTransactionType.EXPENSE,
          amount: '250000',
          cost: '250000',
          profit: '0',
        },
        {
          type: FosTransactionType.COMMISSION,
          amount: '150000',
          cost: '150000',
          profit: '0',
        },
      ]);

      const result = await service.getRunway();

      expect(result.monthlyBurnRate).toBe(400000);
      expect(result.runwayMonths).toBeGreaterThan(0);
    });

    it('should handle zero cash scenario', async () => {
      mockTransactionRepo.find.mockResolvedValue([]);

      const result = await service.getRunway();

      expect(result.closingCashBalance).toBe(0);
      expect(result.runwayMonths).toBe(0);
    });
  });
});
