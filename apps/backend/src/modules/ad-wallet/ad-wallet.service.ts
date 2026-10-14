import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AdWallet } from './entities/ad-wallet.entity';
import {
  AdWalletTransaction,
  AdWalletTransactionType,
} from './entities/ad-wallet-transaction.entity';
import { PaymentsService } from '../payments/payments.service';
import {
  Payment,
  PaymentPurpose,
  PaymentStatus,
} from '../payments/entities/payment.entity';
import {
  AdWalletTopUpDto,
  AdWalletTransactionsQueryDto,
} from './dto/ad-wallet.dto';
import { AD_WALLET_PREPACKS } from './ad-wallet.constants';

const round2 = (value: number) => Math.round(value * 100) / 100;

export interface AdWalletSummary {
  walletRef: string;
  balance: number;
  reserved: number;
  /** What can still be committed to new campaigns. */
  spendable: number;
  currency: 'NGN';
}

/**
 * The naira wallet that funds boosts and promotion campaigns. Every change
 * runs in a transaction holding a row lock on the wallet, and writes a ledger
 * row with the balances after it.
 */
@Injectable()
export class AdWalletService implements OnModuleInit {
  private readonly logger = new Logger(AdWalletService.name);

  constructor(
    @InjectRepository(AdWallet)
    private readonly walletRepo: Repository<AdWallet>,
    @InjectRepository(AdWalletTransaction)
    private readonly txnRepo: Repository<AdWalletTransaction>,
    private readonly paymentsService: PaymentsService,
  ) {}

  /** Called after a top-up is credited (e.g. to launch the campaign it funds). */
  private readonly topUpListeners: ((payment: Payment) => Promise<void>)[] = [];

  onTopUpCredited(listener: (payment: Payment) => Promise<void>): void {
    this.topUpListeners.push(listener);
  }

  onModuleInit() {
    // Paystack webhooks for wallet top-ups are routed here.
    this.paymentsService.registerPurposeHandler(
      PaymentPurpose.AD_WALLET_TOPUP,
      (payment) => this.creditTopUp(payment).then(() => undefined),
    );
  }

  private summarize(wallet: AdWallet): AdWalletSummary {
    return {
      walletRef: wallet.walletRef,
      balance: round2(wallet.balance),
      reserved: round2(wallet.reserved),
      spendable: round2(Math.max(0, wallet.balance - wallet.reserved)),
      currency: 'NGN',
    };
  }

  async getOrCreate(businessId: string): Promise<AdWallet> {
    const existing = await this.walletRepo.findOne({ where: { businessId } });
    if (existing) return existing;
    try {
      return await this.walletRepo.save(
        this.walletRepo.create({
          businessId,
          walletRef: `VEM-WAL-${uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase()}`,
          balance: 0,
          reserved: 0,
        }),
      );
    } catch {
      // Two first requests raced; the other one created it.
      const created = await this.walletRepo.findOne({ where: { businessId } });
      if (!created)
        throw new ServiceUnavailableException('Could not open wallet');
      return created;
    }
  }

  async getSummary(businessId: string): Promise<AdWalletSummary> {
    return this.summarize(await this.getOrCreate(businessId));
  }

  async listTransactions(
    businessId: string,
    query: AdWalletTransactionsQueryDto,
  ) {
    const wallet = await this.getOrCreate(businessId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await this.txnRepo.findAndCount({
      where: { walletId: wallet.id, ...(query.type && { type: query.type }) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((txn) => ({
        id: txn.id,
        type: txn.type,
        amount: round2(txn.amount),
        direction: [
          AdWalletTransactionType.TOPUP,
          AdWalletTransactionType.BONUS,
          AdWalletTransactionType.RELEASE,
        ].includes(txn.type)
          ? 'credit'
          : txn.type === AdWalletTransactionType.ADJUSTMENT
            ? 'adjustment'
            : 'debit',
        description: txn.description,
        reference: txn.reference,
        campaignId: txn.campaignId,
        balanceAfter: round2(txn.balanceAfter),
        reservedAfter: round2(txn.reservedAfter),
        createdAt: txn.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
    };
  }

  getPrepacks() {
    return AD_WALLET_PREPACKS.map((pack) => ({ ...pack }));
  }

  /**
   * Start a top-up: record a pending payment and open a Paystack checkout.
   * The wallet is credited when the charge succeeds (webhook or confirm).
   */
  async startTopUp(
    businessId: string,
    user: { id: string; email?: string | null },
    dto: AdWalletTopUpDto,
    extraMetadata: Record<string, unknown> = {},
  ) {
    if (!dto.prepackId && dto.amount === undefined) {
      throw new BadRequestException('Give a prepackId or an amount');
    }
    if (!user.email) {
      throw new BadRequestException(
        'Your account needs an email address to pay by card',
      );
    }
    const pack = dto.prepackId
      ? AD_WALLET_PREPACKS.find((candidate) => candidate.id === dto.prepackId)
      : undefined;
    const amount = pack ? pack.amount : round2(dto.amount!);
    const bonus = pack ? pack.bonus : 0;

    const wallet = await this.getOrCreate(businessId);
    const reference = `ADW-${uuidv4()}`;
    const metadata = {
      ...extraMetadata,
      businessId,
      walletId: wallet.id,
      prepackId: pack?.id ?? null,
      bonus,
    };

    await this.paymentsService.recordPayment({
      reference,
      amount,
      purpose: PaymentPurpose.AD_WALLET_TOPUP,
      status: PaymentStatus.PENDING,
      metadata,
      userId: user.id,
      businessId,
    });

    const checkout = await this.paymentsService.initializeTransaction({
      email: user.email,
      amount: Math.round(amount * 100),
      reference,
      metadata: { ...metadata, purpose: PaymentPurpose.AD_WALLET_TOPUP },
      callbackUrl: dto.callbackUrl,
    });
    if (!checkout) {
      throw new ServiceUnavailableException(
        'Could not start the card payment; try again',
      );
    }

    return {
      reference,
      amount,
      bonus,
      accessCode: checkout.access_code,
      authorizationUrl: checkout.authorization_url,
    };
  }

  /**
   * Check a top-up with Paystack and credit it if paid. Safe to call any
   * number of times, and alongside the webhook.
   */
  async confirmTopUp(businessId: string, reference: string) {
    const payment = await this.paymentsService.findByReference(reference);
    if (
      !payment ||
      payment.purpose !== PaymentPurpose.AD_WALLET_TOPUP ||
      payment.businessId !== businessId
    ) {
      throw new NotFoundException('Top-up not found');
    }
    const credited = await this.creditTopUp(payment);
    return {
      reference,
      status: credited ? 'completed' : 'pending',
      wallet: await this.getSummary(businessId),
    };
  }

  /**
   * Credit a paid top-up (plus its bundle bonus) exactly once. Returns false
   * when Paystack does not report it paid in full.
   */
  async creditTopUp(payment: Payment): Promise<boolean> {
    const already = await this.txnRepo.findOne({
      where: { reference: payment.reference },
    });
    if (already) return true;

    const verified = await this.paymentsService.verifyTransaction(
      payment.reference,
    );
    const paidKobo = Number(verified?.amount ?? 0);
    if (
      verified?.status !== 'success' ||
      paidKobo < Math.round(Number(payment.amount) * 100)
    ) {
      return false;
    }

    const businessId = payment.businessId;
    const bonus = Number((payment.metadata as { bonus?: number })?.bonus ?? 0);
    await this.getOrCreate(businessId);

    await this.walletRepo.manager.transaction(async (manager) => {
      const wallet = await this.lockWallet(manager, businessId);
      // Re-check under the lock: a concurrent webhook may have just credited.
      const dup = await manager.findOne(AdWalletTransaction, {
        where: { reference: payment.reference },
      });
      if (dup) return;

      await this.apply(manager, wallet, {
        type: AdWalletTransactionType.TOPUP,
        amount: Number(payment.amount),
        reference: payment.reference,
        description: 'Wallet top-up',
      });
      if (bonus > 0) {
        await this.apply(manager, wallet, {
          type: AdWalletTransactionType.BONUS,
          amount: bonus,
          reference: `${payment.reference}:bonus`,
          description: 'Top-up bonus credit',
        });
      }
    });

    await this.paymentsService.recordPayment({
      reference: payment.reference,
      amount: payment.amount,
      purpose: PaymentPurpose.AD_WALLET_TOPUP,
      status: PaymentStatus.SUCCESS,
      metadata: payment.metadata as Record<string, unknown>,
      userId: payment.userId,
      businessId,
    });
    this.logger.log(
      `Ad wallet top-up ${payment.reference} credited for ${businessId}`,
    );
    for (const listener of this.topUpListeners) {
      // A listener failing (e.g. a campaign that can no longer launch) must
      // not undo or fail the credit itself.
      await listener(payment).catch((err: Error) =>
        this.logger.warn(
          `Top-up listener failed for ${payment.reference}: ${err.message}`,
        ),
      );
    }
    return true;
  }

  /** Hold `amount` for a campaign. Fails when the spendable balance is short. */
  async reserve(
    businessId: string,
    campaignId: string,
    amount: number,
    description: string,
  ) {
    return this.mutate(businessId, async (manager, wallet) => {
      const spendable = wallet.balance - wallet.reserved;
      if (amount > spendable + 0.005) {
        throw new BadRequestException(
          `Insufficient wallet balance: ₦${round2(spendable).toLocaleString()} available, ₦${round2(amount).toLocaleString()} needed`,
        );
      }
      await this.apply(manager, wallet, {
        type: AdWalletTransactionType.RESERVE,
        amount,
        campaignId,
        description,
      });
    });
  }

  /** Consume up to `amount` of a campaign's own reserve. */
  async spend(
    businessId: string,
    campaignId: string,
    amount: number,
    description: string,
  ) {
    return this.mutate(businessId, async (manager, wallet) => {
      const outstanding = await this.campaignReserve(
        manager,
        wallet.id,
        campaignId,
      );
      const take = round2(Math.min(amount, outstanding, wallet.reserved));
      if (take <= 0) return;
      await this.apply(manager, wallet, {
        type: AdWalletTransactionType.SPEND,
        amount: take,
        campaignId,
        description,
      });
    });
  }

  /**
   * Return up to `amount` of a campaign's unspent reserve. Capped at what
   * that campaign still holds, so ending one campaign can never free money
   * reserved by another.
   */
  async release(
    businessId: string,
    campaignId: string,
    amount: number,
    description: string,
  ) {
    return this.mutate(businessId, async (manager, wallet) => {
      const outstanding = await this.campaignReserve(
        manager,
        wallet.id,
        campaignId,
      );
      const back = round2(Math.min(amount, outstanding, wallet.reserved));
      if (back <= 0) return;
      await this.apply(manager, wallet, {
        type: AdWalletTransactionType.RELEASE,
        amount: back,
        campaignId,
        description,
      });
    });
  }

  /** What a campaign still holds: reserved − spent − released, from the ledger. */
  async campaignReserve(
    manager: EntityManager,
    walletId: string,
    campaignId: string,
  ): Promise<number> {
    const [row] = await manager.query<{ outstanding: string | null }[]>(
      `SELECT COALESCE(SUM(CASE WHEN "type" = 'reserve' THEN "amount" ELSE -"amount" END), 0) AS outstanding
       FROM "ad_wallet_transactions"
       WHERE "walletId" = $1 AND "campaignId" = $2
         AND "type" IN ('reserve', 'spend', 'release')`,
      [walletId, campaignId],
    );
    return Math.max(0, round2(Number(row?.outstanding ?? 0)));
  }

  private async mutate(
    businessId: string,
    change: (manager: EntityManager, wallet: AdWallet) => Promise<void>,
  ): Promise<AdWalletSummary> {
    await this.getOrCreate(businessId);
    const wallet = await this.walletRepo.manager.transaction(
      async (manager) => {
        const locked = await this.lockWallet(manager, businessId);
        await change(manager, locked);
        return locked;
      },
    );
    return this.summarize(wallet);
  }

  private lockWallet(
    manager: EntityManager,
    businessId: string,
  ): Promise<AdWallet> {
    return manager
      .getRepository(AdWallet)
      .createQueryBuilder('wallet')
      .setLock('pessimistic_write')
      .where('wallet.businessId = :businessId', { businessId })
      .getOneOrFail();
  }

  /** Move money and write the ledger row. Mutates `wallet` in place. */
  private async apply(
    manager: EntityManager,
    wallet: AdWallet,
    entry: {
      type: AdWalletTransactionType;
      amount: number;
      description: string;
      reference?: string;
      campaignId?: string;
    },
  ): Promise<void> {
    const amount = round2(entry.amount);
    switch (entry.type) {
      case AdWalletTransactionType.TOPUP:
      case AdWalletTransactionType.BONUS:
        wallet.balance = round2(wallet.balance + amount);
        break;
      case AdWalletTransactionType.RESERVE:
        wallet.reserved = round2(wallet.reserved + amount);
        break;
      case AdWalletTransactionType.SPEND:
        wallet.balance = round2(wallet.balance - amount);
        wallet.reserved = round2(wallet.reserved - amount);
        break;
      case AdWalletTransactionType.RELEASE:
        wallet.reserved = round2(wallet.reserved - amount);
        break;
      default:
        throw new BadRequestException(
          `Unsupported wallet movement ${entry.type}`,
        );
    }
    await manager.save(AdWallet, wallet);
    await manager.save(
      AdWalletTransaction,
      manager.create(AdWalletTransaction, {
        walletId: wallet.id,
        businessId: wallet.businessId,
        type: entry.type,
        amount,
        reference: entry.reference ?? null,
        campaignId: entry.campaignId ?? null,
        description: entry.description.slice(0, 200),
        balanceAfter: wallet.balance,
        reservedAfter: wallet.reserved,
      }),
    );
  }
}
