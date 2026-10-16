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
      update: jest.fn().mockResolvedValue(undefined),
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

  describe('saved card', () => {
    const authorization = {
      authorization_code: 'AUTH_secret',
      reusable: true,
      last4: '4242',
      exp_month: '08',
      exp_year: '2027',
      brand: 'visa',
      bank: 'Test Bank',
    };

    it('shows the card for display but never the authorization code', async () => {
      Object.assign(wallet, {
        cardAuthorizationCode: 'AUTH_secret',
        cardSummary: {
          brand: 'visa',
          last4: '4242',
          expMonth: '08',
          expYear: '2027',
          bank: null,
        },
        autoReload: {
          enabled: true,
          threshold: 2000,
          amount: 10000,
          lastError: null,
        },
      });
      const summary = await service.getSummary('biz-1');
      expect(summary.card).toEqual(expect.objectContaining({ last4: '4242' }));
      expect(summary.autoReload).toEqual({
        enabled: true,
        threshold: 2000,
        amount: 10000,
        lastError: null,
      });
      expect(JSON.stringify(summary)).not.toContain('AUTH_secret');
    });

    it('saves a reusable card when the owner asked to', async () => {
      payments.verifyTransaction.mockResolvedValue({
        status: 'success',
        amount: 2_500_000,
        authorization,
      });
      await service.creditTopUp(
        topUpPayment({
          metadata: { bonus: 0, saveCard: true, cardEmail: 'owner@biz.test' },
        }) as any,
      );
      expect(walletRepo.update).toHaveBeenCalledWith(
        { businessId: 'biz-1' },
        {
          cardAuthorizationCode: 'AUTH_secret',
          cardEmail: 'owner@biz.test',
          cardSummary: {
            brand: 'visa',
            last4: '4242',
            expMonth: '08',
            expYear: '2027',
            bank: 'Test Bank',
          },
        },
      );
    });

    it('does not save the card without consent, or when it is not reusable', async () => {
      payments.verifyTransaction.mockResolvedValue({
        status: 'success',
        amount: 2_500_000,
        authorization,
      });
      await service.creditTopUp(
        topUpPayment({ metadata: { bonus: 0 } }) as any,
      );

      txnRepo.findOne.mockResolvedValue(null);
      payments.verifyTransaction.mockResolvedValue({
        status: 'success',
        amount: 2_500_000,
        authorization: { ...authorization, reusable: false },
      });
      await service.creditTopUp(
        topUpPayment({
          reference: 'ADW-2',
          metadata: { bonus: 0, saveCard: true, cardEmail: 'owner@biz.test' },
        }) as any,
      );
      expect(walletRepo.update).not.toHaveBeenCalled();
    });

    it('forgets the card and switches auto-reload off', async () => {
      Object.assign(wallet, {
        cardAuthorizationCode: 'AUTH_secret',
        cardSummary: { brand: 'visa', last4: '4242' },
        autoReload: { enabled: true, threshold: 2000, amount: 10000 },
      });
      const summary = await service.removeCard('biz-1');
      expect(walletRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cardAuthorizationCode: null,
          cardSummary: null,
          autoReload: expect.objectContaining({ enabled: false }),
        }),
      );
      expect(summary.card).toBeNull();
    });
  });

  describe('top up with the saved card', () => {
    beforeEach(() => {
      Object.assign(wallet, {
        cardAuthorizationCode: 'AUTH_secret',
        cardEmail: 'owner@biz.test',
        cardSummary: { brand: 'visa', last4: '4242' },
      });
      payments.chargeAuthorization = jest
        .fn()
        .mockResolvedValue({ status: 'success' });
      payments.findByReference.mockImplementation((reference: string) =>
        Promise.resolve(topUpPayment({ reference, metadata: { bonus: 2000 } })),
      );
    });

    it('charges the card under our reference and credits the bundle', async () => {
      const result = await service.topUpWithSavedCard('biz-1', 'u-1', {
        prepackId: '25k',
      });
      expect(result.status).toBe('completed');
      const [amount, email, code, options] =
        payments.chargeAuthorization.mock.calls[0];
      expect([email, code]).toEqual(['owner@biz.test', 'AUTH_secret']);
      expect(amount).toBe(25000);
      expect(options.reference).toBe(result.reference);
      expect(result.reference).toMatch(/^ADW-/);
      expect(payments.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: result.reference,
          status: PaymentStatus.PENDING,
        }),
      );
      expect(manager.save).toHaveBeenCalled();
    });

    it('credits nothing when the card is declined', async () => {
      payments.chargeAuthorization.mockResolvedValue(null);
      const result = await service.topUpWithSavedCard('biz-1', 'u-1', {
        amount: 5000,
      });
      expect(result).toEqual(
        expect.objectContaining({
          status: 'failed',
          reason: expect.any(String),
        }),
      );
      expect(payments.verifyTransaction).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('needs a saved card', async () => {
      wallet.cardAuthorizationCode = null;
      await expect(
        service.topUpWithSavedCard('biz-1', 'u-1', { amount: 5000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(payments.chargeAuthorization).not.toHaveBeenCalled();
    });
  });

  describe('auto-reload', () => {
    const now = new Date('2026-10-16T12:00:00Z');

    beforeEach(() => {
      Object.assign(wallet, {
        balance: 1000,
        reserved: 0,
        cardAuthorizationCode: 'AUTH_secret',
        cardEmail: 'owner@biz.test',
        autoReload: { enabled: true, threshold: 2000, amount: 10000 },
      });
      walletRepo.find = jest.fn().mockResolvedValue([wallet]);
      payments.chargeAuthorization = jest
        .fn()
        .mockResolvedValue({ status: 'success' });
      payments.findByReference.mockImplementation((reference: string) =>
        Promise.resolve(
          topUpPayment({ reference, amount: 10000, metadata: { bonus: 0 } }),
        ),
      );
      payments.verifyTransaction.mockResolvedValue({
        status: 'success',
        amount: 1_000_000,
      });
    });

    it('saves the settings, and needs a card to switch on', async () => {
      const summary = await service.setAutoReload('biz-1', {
        enabled: true,
        threshold: 3000,
        amount: 15000,
      });
      expect(summary.autoReload).toEqual({
        enabled: true,
        threshold: 3000,
        amount: 15000,
        lastError: null,
      });

      wallet.cardAuthorizationCode = null;
      await expect(
        service.setAutoReload('biz-1', {
          enabled: true,
          threshold: 3000,
          amount: 15000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.setAutoReload('biz-1', {
          enabled: false,
          threshold: 3000,
          amount: 15000,
        }),
      ).resolves.toBeDefined();
    });

    it('reloads a wallet below its threshold and records the attempt', async () => {
      expect(await service.runAutoReloads(now)).toBe(1);
      expect(payments.chargeAuthorization.mock.calls[0][0]).toBe(10000);
      expect(walletRepo.update).toHaveBeenLastCalledWith(
        { businessId: 'biz-1' },
        {
          autoReload: expect.objectContaining({
            enabled: true,
            lastAttemptAt: now.toISOString(),
            lastError: null,
          }),
        },
      );
    });

    it('skips wallets above the threshold, switched off, or tried within the hour', async () => {
      wallet.balance = 5000;
      expect(await service.runAutoReloads(now)).toBe(0);

      wallet.balance = 1000;
      wallet.autoReload = { ...wallet.autoReload, enabled: false };
      expect(await service.runAutoReloads(now)).toBe(0);

      wallet.autoReload = {
        enabled: true,
        threshold: 2000,
        amount: 10000,
        lastAttemptAt: new Date(now.getTime() - 30 * 60_000).toISOString(),
      };
      expect(await service.runAutoReloads(now)).toBe(0);
      expect(payments.chargeAuthorization).not.toHaveBeenCalled();
    });

    it('switches itself off with the reason when the card is declined', async () => {
      payments.chargeAuthorization.mockResolvedValue(null);
      expect(await service.runAutoReloads(now)).toBe(0);
      expect(walletRepo.update).toHaveBeenLastCalledWith(
        { businessId: 'biz-1' },
        {
          autoReload: expect.objectContaining({
            enabled: false,
            lastError: 'Your saved card was declined',
          }),
        },
      );
    });
  });
});
