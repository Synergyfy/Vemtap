import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AdWalletService } from './ad-wallet.service';
import { AdWallet } from './entities/ad-wallet.entity';
import {
  AdWalletTransaction,
  AdWalletTransactionType,
} from './entities/ad-wallet-transaction.entity';
import { PaymentsService } from '../payments/payments.service';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../payments/entities/payment.entity';

describe('AdWalletService', () => {
  let service: AdWalletService;
  let walletRepo: any;
  let txnRepo: any;
  let payments: any;
  let manager: any;
  let wallet: any;

  const topUpPayment = (overrides: Record<string, unknown> = {}) => ({
    reference: 'ADW-1',
    amount: 25000,
    purpose: PaymentPurpose.AD_WALLET_TOPUP,
    status: PaymentStatus.PENDING,
    businessId: 'biz-1',
    userId: 'u-1',
    metadata: { bonus: 2000 },
    ...overrides,
  });

  beforeEach(async () => {
    wallet = {
      id: 'w-1',
      businessId: 'biz-1',
      walletRef: 'VEM-WAL-ABC',
      balance: 1000,
      reserved: 0,
    };
    manager = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockImplementation((_entity, data) => data),
      query: jest.fn().mockResolvedValue([{ outstanding: '0' }]),
      getRepository: () => ({
        createQueryBuilder: () => ({
          setLock: () => ({
            where: () => ({ getOneOrFail: () => Promise.resolve(wallet) }),
          }),
        }),
      }),
    };
    walletRepo = {
      findOne: jest.fn().mockResolvedValue(wallet),
      save: jest.fn().mockImplementation((w) => Promise.resolve(w)),
      create: jest.fn().mockImplementation((w) => w),
      manager: { transaction: jest.fn((cb) => cb(manager)) },
    };
    txnRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    payments = {
      registerPurposeHandler: jest.fn(),
      recordPayment: jest.fn().mockResolvedValue({}),
      initializeTransaction: jest.fn().mockResolvedValue({
        access_code: 'AC_1',
        authorization_url: 'https://checkout.paystack.com/x',
      }),
      verifyTransaction: jest
        .fn()
        .mockResolvedValue({ status: 'success', amount: 2_500_000 }),
      findByReference: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AdWalletService,
        { provide: getRepositoryToken(AdWallet), useValue: walletRepo },
        { provide: getRepositoryToken(AdWalletTransaction), useValue: txnRepo },
        { provide: PaymentsService, useValue: payments },
      ],
    }).compile();
    service = module.get(AdWalletService);
  });

  it('registers itself as the handler for wallet top-up payments', () => {
    service.onModuleInit();
    expect(payments.registerPurposeHandler).toHaveBeenCalledWith(
      PaymentPurpose.AD_WALLET_TOPUP,
      expect.any(Function),
    );
  });

  describe('startTopUp', () => {
    const user = { id: 'u-1', email: 'owner@biz.ng' };

    it('opens a checkout for a prepack and records a pending payment', async () => {
      const result = await service.startTopUp('biz-1', user, {
        prepackId: '25k',
      });

      expect(result).toMatchObject({
        amount: 25000,
        bonus: 2000,
        accessCode: 'AC_1',
      });
      expect(result.reference).toMatch(/^ADW-/);
      expect(payments.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25000,
          purpose: PaymentPurpose.AD_WALLET_TOPUP,
          status: PaymentStatus.PENDING,
          businessId: 'biz-1',
        }),
      );
      expect(payments.initializeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 2_500_000, email: 'owner@biz.ng' }),
      );
    });

    it('gives no bonus on a custom amount', async () => {
      const result = await service.startTopUp('biz-1', user, { amount: 15000 });
      expect(result).toMatchObject({ amount: 15000, bonus: 0 });
    });

    it('needs a prepack or an amount, and an email', async () => {
      await expect(service.startTopUp('biz-1', user, {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.startTopUp(
          'biz-1',
          { id: 'u-1', email: null },
          { amount: 5000 },
        ),
      ).rejects.toThrow(/email/);
    });

    it('reports a checkout that could not be opened', async () => {
      payments.initializeTransaction.mockResolvedValue(null);
      await expect(
        service.startTopUp('biz-1', user, { amount: 5000 }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('creditTopUp', () => {
    it('credits the payment and its bonus once, then marks the payment paid', async () => {
      const credited = await service.creditTopUp(topUpPayment() as any);

      expect(credited).toBe(true);
      const ledger = manager.save.mock.calls
        .filter(([entity]: [unknown]) => entity === AdWalletTransaction)
        .map(([, row]: [unknown, any]) => [
          row.type,
          row.amount,
          row.balanceAfter,
        ]);
      expect(ledger).toEqual([
        [AdWalletTransactionType.TOPUP, 25000, 26000],
        [AdWalletTransactionType.BONUS, 2000, 28000],
      ]);
      expect(payments.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: 'ADW-1',
          status: PaymentStatus.SUCCESS,
        }),
      );
    });

    it('is a no-op for a reference that was already credited', async () => {
      txnRepo.findOne.mockResolvedValue({ id: 't-1' });
      expect(await service.creditTopUp(topUpPayment() as any)).toBe(true);
      expect(payments.verifyTransaction).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('re-checks under the lock so a racing webhook cannot double-credit', async () => {
      manager.findOne.mockResolvedValue({ id: 't-1' });
      await service.creditTopUp(topUpPayment() as any);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('does not credit an unpaid or underpaid charge', async () => {
      payments.verifyTransaction.mockResolvedValueOnce({
        status: 'failed',
        amount: 2_500_000,
      });
      expect(await service.creditTopUp(topUpPayment() as any)).toBe(false);
      payments.verifyTransaction.mockResolvedValueOnce({
        status: 'success',
        amount: 100_000,
      });
      expect(await service.creditTopUp(topUpPayment() as any)).toBe(false);
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('confirmTopUp', () => {
    it("404s for another business's or another purpose's reference", async () => {
      payments.findByReference.mockResolvedValue(
        topUpPayment({ businessId: 'biz-2' }),
      );
      await expect(service.confirmTopUp('biz-1', 'ADW-1')).rejects.toThrow(
        NotFoundException,
      );
      payments.findByReference.mockResolvedValue(
        topUpPayment({ purpose: PaymentPurpose.SUBSCRIPTION }),
      );
      await expect(service.confirmTopUp('biz-1', 'ADW-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('reports pending until Paystack confirms the charge', async () => {
      payments.findByReference.mockResolvedValue(topUpPayment());
      payments.verifyTransaction.mockResolvedValue({
        status: 'abandoned',
        amount: 0,
      });
      const result = await service.confirmTopUp('biz-1', 'ADW-1');
      expect(result.status).toBe('pending');
    });
  });

  describe('reserve / spend / release', () => {
    it('refuses to reserve more than is spendable', async () => {
      wallet.balance = 10000;
      wallet.reserved = 8000;
      await expect(
        service.reserve('biz-1', 'c-1', 3000, 'boost'),
      ).rejects.toThrow(/₦2,000 available/);
    });

    it('releases only what the campaign itself still holds', async () => {
      wallet.balance = 20000;
      wallet.reserved = 14000; // 11k for c-1, 3k for another campaign
      manager.query.mockResolvedValue([{ outstanding: '11000' }]);

      const summary = await service.release('biz-1', 'c-1', 50000, 'ended');

      expect(summary).toMatchObject({ reserved: 3000, spendable: 17000 });
    });
  });
});
