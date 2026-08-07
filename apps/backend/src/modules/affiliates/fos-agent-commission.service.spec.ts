import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FosAgentCommissionService } from './fos-agent-commission.service';
import {
  FosAgentCommission,
  FosCommissionStatus,
} from './entities/agent-commission.entity';
import { FinancialTransaction } from '../fos-core/entities/financial-transaction.entity';

describe('FosAgentCommissionService', () => {
  let service: FosAgentCommissionService;

  const mockCommissionRepo = {
    findOne: jest.fn(),
    create: jest.fn((obj: object) => ({ ...obj })),
    save: jest.fn(async (row: any) => ({ ...row, id: row.id || 'c1' })),
    find: jest.fn(),
  };
  const mockTransactionRepo = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosAgentCommissionService,
        {
          provide: getRepositoryToken(FosAgentCommission),
          useValue: mockCommissionRepo,
        },
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    service = module.get<FosAgentCommissionService>(FosAgentCommissionService);
  });

  describe('getCommission', () => {
    it('should compute revenue and commission from transactions', async () => {
      mockTransactionRepo.find.mockResolvedValue([
        { type: 'SUBSCRIPTION', amount: '1000000' },
        { type: 'SMS', amount: '200000' },
        { type: 'COMMISSION', amount: '120000' },
      ]);
      mockCommissionRepo.findOne.mockResolvedValue(null);

      const result = await service.getCommission('agt-1');

      expect(result.commissionEarned).toBe(120000);
      expect(result.revenueAttributed).toBe(1200000);
      expect(result.status).toBe('pending');
    });
  });

  describe('getSummary', () => {
    it('should group counts and totals by status', async () => {
      mockCommissionRepo.find.mockResolvedValue([
        { status: 'pending', commissionEarned: '100' },
        { status: 'pending', commissionEarned: '200' },
        { status: 'approved', commissionEarned: '50' },
        { status: 'paid', commissionEarned: '75' },
      ]);

      const result = await service.getSummary();

      expect(result.pendingCount).toBe(2);
      expect(result.pendingTotal).toBe(300);
      expect(result.approvedCount).toBe(1);
      expect(result.paidCount).toBe(1);
    });
  });

  describe('enrichAgentsPayload', () => {
    it('should enrich an array payload', async () => {
      mockTransactionRepo.find.mockResolvedValue([]);
      mockCommissionRepo.findOne.mockResolvedValue(null);

      const result = await service.enrichAgentsPayload([{ id: 'agt-1' }]);

      expect(Array.isArray(result)).toBe(true);
      expect((result as any)[0].commissionStatus).toBe('pending');
    });

    it('should enrich a { data } payload', async () => {
      mockTransactionRepo.find.mockResolvedValue([]);
      mockCommissionRepo.findOne.mockResolvedValue(null);

      const result = (await service.enrichAgentsPayload({
        data: [{ id: 'agt-1' }],
      })) as any;

      expect(result.data[0].commissionStatus).toBe('pending');
    });
  });
});
