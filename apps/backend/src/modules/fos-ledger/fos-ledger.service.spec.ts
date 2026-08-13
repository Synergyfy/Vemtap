import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FosLedgerService } from './fos-ledger.service';
import { FinancialTransaction } from '../fos-core/entities/financial-transaction.entity';
import { Expense } from '../fos-core/entities/expense.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import { FosInvoice, FosInvoiceStatus } from './entities/invoice.entity';
import { FosBill, FosBillStatus } from './entities/bill.entity';

describe('FosLedgerService', () => {
  let service: FosLedgerService;

  const mockTransactionRepo = { find: jest.fn() };
  const mockExpenseRepo = { find: jest.fn() };
  const mockSubscriptionRepo = { find: jest.fn() };
  const mockBusinessRepo = {};
  const mockInvoiceRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((obj: object) => ({ ...obj })),
    save: jest.fn((row: object) => Promise.resolve({ ...row })),
    remove: jest.fn(),
  };
  const mockBillRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((obj: object) => ({ ...obj })),
    save: jest.fn((row: object) => Promise.resolve({ ...row })),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosLedgerService,
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepo,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepo,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepo,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepo,
        },
        {
          provide: getRepositoryToken(FosInvoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(FosBill),
          useValue: mockBillRepo,
        },
      ],
    }).compile();

    service = module.get<FosLedgerService>(FosLedgerService);
  });

  describe('getReceivables', () => {
    it('should merge manual invoices with subscription-derived invoices', async () => {
      mockSubscriptionRepo.find.mockResolvedValue([
        {
          status: 'ACTIVE',
          plan: { monthlyPrice: '45000' },
          endDate: '2026-07-13',
          business: { name: 'Lagos Pizza Co.' },
        },
      ]);
      mockInvoiceRepo.find.mockResolvedValue([
        {
          id: 'inv-manual',
          customer: 'Zenith Logistics',
          amount: '250000',
          dueDate: '2026-07-23',
          status: FosInvoiceStatus.PENDING,
          source: 'manual',
        },
      ]);
      mockTransactionRepo.find.mockResolvedValue([]);

      const result = await service.getReceivables();

      expect(result.invoices).toHaveLength(2);
      expect(result.totalOutstanding).toBeGreaterThan(0);
      expect(result.invoices[0].customer).toBe('Zenith Logistics');
    });

    it('should return zero totals when nothing exists', async () => {
      mockSubscriptionRepo.find.mockResolvedValue([]);
      mockInvoiceRepo.find.mockResolvedValue([]);
      mockTransactionRepo.find.mockResolvedValue([]);

      const result = await service.getReceivables();

      expect(result.invoices).toHaveLength(0);
      expect(result.totalOutstanding).toBe(0);
      expect(result.totalOverdue).toBe(0);
    });
  });

  describe('getPayables', () => {
    it('should merge manual bills with expense-derived bills', async () => {
      mockExpenseRepo.find.mockResolvedValue([
        {
          category: 'Termii SMS Gateway',
          amount: '420000',
          date: '2026-07-15',
        },
      ]);
      mockBillRepo.find.mockResolvedValue([
        {
          id: 'bill-manual',
          description: 'Office Rent',
          amount: '500000',
          dueDate: '2026-07-20',
          status: FosBillStatus.PENDING,
          category: 'Office',
          source: 'manual',
        },
      ]);

      const result = await service.getPayables();

      expect(result.bills).toHaveLength(2);
      expect(result.totalBills).toBeGreaterThan(0);
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice with manual source', async () => {
      const result = await service.createInvoice({
        customer: 'Zenith Logistics',
        amount: 250000,
        dueDate: '2099-07-23',
      });

      expect(result.customer).toBe('Zenith Logistics');
      expect(result.status).toBe(FosInvoiceStatus.PENDING);
    });
  });

  describe('updateBill', () => {
    it('should throw when bill is missing', async () => {
      mockBillRepo.findOne.mockResolvedValue(null);
      await expect(service.updateBill('nope', { amount: 100 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
