import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FosDashboardService } from './fos-dashboard.service';
import {
  FinancialTransaction,
  FosTransactionType,
  FosPlatform,
} from '../fos-core/entities/financial-transaction.entity';
import { MetricsSnapshot } from './entities/metrics-snapshot.entity';

describe('FosDashboardService', () => {
  let service: FosDashboardService;
  let transactionRepo: Repository<FinancialTransaction>;
  let snapshotRepo: Repository<MetricsSnapshot>;

  const mockTransactionRepo = {
    find: jest.fn(),
  };

  const mockSnapshotRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosDashboardService,
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

    service = module.get<FosDashboardService>(FosDashboardService);
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

  describe('getStats', () => {
    it('should return computed dashboard stats', async () => {
      mockTransactionRepo.find.mockResolvedValue([
        {
          type: FosTransactionType.SUBSCRIPTION,
          platform: FosPlatform.VEMTAP,
          amount: '1000000',
          profit: '300000',
          cost: '0',
          businessId: 'biz-1',
          agentId: 'agent-1',
        },
        {
          type: FosTransactionType.SMS,
          platform: FosPlatform.QRTHRIVE,
          amount: '500000',
          profit: '200000',
          cost: '50000',
          businessId: 'biz-2',
          agentId: null,
        },
        {
          type: FosTransactionType.COMMISSION,
          platform: FosPlatform.VEMTAP,
          amount: '150000',
          profit: '0',
          cost: '150000',
          businessId: 'biz-1',
          agentId: 'agent-1',
        },
      ]);

      mockSnapshotRepo.find.mockResolvedValue([
        {
          churnRate: '5.2',
          conversionRate: '12.8',
        },
      ]);

      const result = await service.getStats();

      expect(result.totalRevenue).toBe(1500000);
      expect(result.netProfit).toBe(500000);
      expect(result.totalBusinesses).toBe(2);
      expect(result.activeAgents).toBe(1);
      expect(result.vemtapRevenue).toBe(1000000);
      expect(result.qrthriveRevenue).toBe(500000);
      expect(result.commissionsPaid).toBe(150000);
      expect(result.churnRate).toBe(5.2);
      expect(result.conversionRate).toBe(12.8);
    });

    it('should return zero stats when no transactions exist', async () => {
      mockTransactionRepo.find.mockResolvedValue([]);
      mockSnapshotRepo.find.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.totalRevenue).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.totalBusinesses).toBe(0);
      expect(result.activeAgents).toBe(0);
      expect(result.churnRate).toBe(0);
      expect(result.conversionRate).toBe(0);
    });
  });

  describe('getSnapshots', () => {
    it('should return last 30 days of snapshots', async () => {
      const mockSnapshots = [
        {
          date: '2026-01-15',
          totalRevenue: '1250000',
          totalProfit: '450000',
          totalBusinesses: 340,
          churnRate: '5.2',
          conversionRate: '12.8',
        },
        {
          date: '2026-01-14',
          totalRevenue: '1200000',
          totalProfit: '400000',
          totalBusinesses: 338,
          churnRate: '5.0',
          conversionRate: '12.5',
        },
      ];
      mockSnapshotRepo.find.mockResolvedValue(mockSnapshots);

      const result = await service.getSnapshots();

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-01-15');
      expect(result[0].totalRevenue).toBe(1250000);
    });

    it('should return empty array when no snapshots', async () => {
      mockSnapshotRepo.find.mockResolvedValue([]);

      const result = await service.getSnapshots();

      expect(result).toEqual([]);
    });
  });

  describe('getInsights', () => {
    it('should generate high performance insight for top agent', async () => {
      mockTransactionRepo.find.mockResolvedValue([
        {
          type: FosTransactionType.SUBSCRIPTION,
          amount: '500000',
          agentId: 'agent-1',
        },
        {
          type: FosTransactionType.SUBSCRIPTION,
          amount: '300000',
          agentId: 'agent-2',
        },
      ]);

      const result = await service.getInsights();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((i) => i.type === 'HIGH_PERFORMANCE')).toBe(true);
    });

    it('should generate SMS alert for high usage businesses', async () => {
      mockTransactionRepo.find.mockResolvedValue([
        {
          type: FosTransactionType.SMS,
          amount: '5000',
          businessId: 'biz-high',
        },
      ]);

      const result = await service.getInsights();

      expect(result.some((i) => i.type === 'SMS_ALERT')).toBe(true);
    });

    it('should return empty insights when no data', async () => {
      mockTransactionRepo.find.mockResolvedValue([]);

      const result = await service.getInsights();

      expect(result).toEqual([]);
    });
  });
});
