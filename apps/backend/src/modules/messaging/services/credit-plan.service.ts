import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditPlan } from '../entities/credit-plan.entity';
import { CreateCreditPlanDto } from '../dto/create-credit-plan.dto';
import { BusinessCreditWallet } from '../entities/business-credit-wallet.entity';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';
import { Channel } from '../enums/channel.enum';
import { PaymentsService } from '../../payments/payments.service';
import {
  Payment,
  PaymentPurpose,
  PaymentStatus,
} from '../../payments/entities/payment.entity';
import { CreditService } from './credit.service';
import { BranchesService } from '../../branches/branches.service';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class CreditPlanService implements OnModuleInit {
  private readonly logger = new Logger(CreditPlanService.name);
  constructor(
    @InjectRepository(CreditPlan)
    private readonly creditPlanRepository: Repository<CreditPlan>,
    private readonly paymentsService: PaymentsService,
    private readonly creditService: CreditService,
    private readonly branchesService: BranchesService,
    private readonly settingsService: SettingsService,
  ) {}

  onModuleInit() {
    // Paystack webhooks for credit checkouts are routed here.
    this.paymentsService.registerPurposeHandler(
      PaymentPurpose.CREDIT_TOPUP,
      (payment) => this.completeCheckout(payment).then(() => undefined),
    );
  }

  async purchaseCustom(
    branchId: string,
    reference: string,
    smsAmount: number,
    whatsappAmount: number,
    emailAmount: number,
    aiAmount: number = 0,
    callerBusinessId?: string | null,
  ): Promise<BusinessCreditWallet> {
    await this.assertBranchOwned(branchId, callerBusinessId);
    // Idempotency: check if reference has already been processed
    const existingPayment =
      await this.paymentsService.findByReference(reference);
    if (existingPayment) {
      this.logger.warn(
        `Idempotency triggered: Custom credit purchase for reference ${reference} has already been processed.`,
      );
      const branch = await this.branchesService.findById(branchId);
      return this.creditService.getOrCreateWallet(branch.businessId);
    }

    const settings = await this.settingsService.getGlobalSettings();
    const priceSms = Number(settings.creditPriceSms) || 15;
    const priceWhatsapp = Number(settings.creditPriceWhatsapp) || 25;
    const priceEmail = Number(settings.creditPriceEmail) || 2;
    const priceAi = Number(settings.creditPriceAi) || 50;

    const expectedPrice =
      smsAmount * priceSms +
      whatsappAmount * priceWhatsapp +
      emailAmount * priceEmail +
      (aiAmount || 0) * priceAi;

    if (expectedPrice <= 0) {
      throw new BadRequestException(
        'Total custom purchase amount must be greater than zero.',
      );
    }

    const paymentData = await this.paymentsService.verifyTransaction(reference);
    if (!paymentData) {
      this.logger.error(
        `Payment verification failed for custom reference: ${reference}`,
      );
      throw new BadRequestException(
        'Payment verification failed. Please check your transaction reference.',
      );
    }

    const paidAmount = Math.round(paymentData.amount / 100);
    if (paidAmount < Math.round(expectedPrice)) {
      this.logger.warn(
        `Insufficient payment for custom credits. Expected ${expectedPrice}, got ${paidAmount}`,
      );
      throw new BadRequestException(
        `Insufficient payment amount. Expected ${expectedPrice}, but verified payment was ${paidAmount}`,
      );
    }

    const branch = await this.branchesService.findById(branchId);
    const businessId = branch.businessId;

    await this.paymentsService.recordPayment({
      reference,
      amount: expectedPrice,
      purpose: PaymentPurpose.CREDIT_TOPUP,
      status: PaymentStatus.SUCCESS,
      branchId,
      businessId,
      metadata: {
        smsAmount,
        whatsappAmount,
        emailAmount,
        aiAmount,
        priceSms,
        priceWhatsapp,
        priceEmail,
        priceAi,
        isCustomPurchase: true,
      },
    });

    if (smsAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.SMS,
        smsAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Custom Top-up: ${smsAmount} SMS Credits`,
      );
    }
    if (whatsappAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.WHATSAPP,
        whatsappAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Custom Top-up: ${whatsappAmount} WhatsApp Credits`,
      );
    }
    if (emailAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.EMAIL,
        emailAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Custom Top-up: ${emailAmount} Email Credits`,
      );
    }
    if (aiAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.AI,
        aiAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Custom Top-up: ${aiAmount} AI Credits`,
      );
    }

    return this.creditService.getOrCreateWallet(businessId);
  }

  async purchase(
    branchId: string,
    planId: string,
    reference: string,
    callerBusinessId?: string | null,
  ): Promise<BusinessCreditWallet> {
    await this.assertBranchOwned(branchId, callerBusinessId);
    // Idempotency: check if reference has already been processed
    const existingPayment =
      await this.paymentsService.findByReference(reference);
    if (existingPayment) {
      this.logger.warn(
        `Idempotency triggered: Credit package purchase for reference ${reference} has already been processed.`,
      );
      if (existingPayment.purpose !== PaymentPurpose.CREDIT_TOPUP) {
        throw new BadRequestException('This payment is not a credit top-up.');
      }
      const branch = await this.branchesService.findById(branchId);
      return this.creditService.getOrCreateWallet(branch.businessId);
    }

    const plan = await this.findOne(planId);

    const paymentData = await this.paymentsService.verifyTransaction(reference);
    if (!paymentData) {
      this.logger.error(
        `Payment verification failed for reference: ${reference}`,
      );
      throw new BadRequestException(
        'Payment verification failed. Please check your transaction reference.',
      );
    }

    const paidAmount = Math.round(paymentData.amount / 100);
    if (paidAmount < Math.round(plan.price)) {
      this.logger.warn(
        `Insufficient payment for plan ${planId}. Expected ${plan.price}, got ${paidAmount}`,
      );
      throw new BadRequestException(
        `Insufficient payment amount. Expected ${plan.price}, but verified payment was ${paidAmount}`,
      );
    }

    const branch = await this.branchesService.findById(branchId);
    const businessId = branch.businessId;

    await this.paymentsService.recordPayment({
      reference,
      amount: plan.price,
      purpose: PaymentPurpose.CREDIT_TOPUP,
      status: PaymentStatus.SUCCESS,
      branchId,
      businessId,
      metadata: { planId, ...plan },
    });

    await this.awardPlan(businessId, plan);

    return this.creditService.getOrCreateWallet(businessId);
  }

  /**
   * The legacy reference routes take a branch from the body; it must belong to
   * the caller's business (admins excepted, `callerBusinessId` undefined).
   */
  private async assertBranchOwned(
    branchId: string,
    callerBusinessId: string | null | undefined,
  ): Promise<void> {
    if (callerBusinessId === undefined) return;
    const branch = await this.branchesService.findById(branchId);
    if (!callerBusinessId || branch.businessId !== callerBusinessId) {
      throw new ForbiddenException('That branch is not part of your business');
    }
  }

  /** Every channel a plan carries goes into the business wallet. */
  private async awardPlan(businessId: string, plan: CreditPlan): Promise<void> {
    const grants: Array<[Channel, number]> = [
      [Channel.SMS, plan.smsAmount],
      [Channel.EMAIL, plan.emailAmount],
      [Channel.WHATSAPP, plan.whatsappAmount],
      [Channel.AI, plan.aiAmount],
    ];
    for (const [channel, amount] of grants) {
      if (amount > 0) {
        await this.creditService.addCredits(
          businessId,
          channel,
          amount,
          CreditTransactionType.CREDIT_TOPUP,
          `Top-up: ${plan.name}`,
        );
      }
    }
  }

  /**
   * Start a card payment for a credit plan. The payment row is written first
   * (pending, scoped to the caller's business), so confirmation and the
   * webhook both know what was bought and for whom.
   */
  async startCheckout(
    user: {
      id: string;
      email: string;
      businessId?: string | null;
      branchId?: string | null;
    },
    planId: string,
    callbackUrl?: string,
  ) {
    if (!user.businessId) {
      throw new ForbiddenException('Credits are bought by a business account');
    }
    const plan = await this.findOne(planId);
    if (!plan.isActive) throw new NotFoundException('Credit plan not found');
    const amount = Number(plan.price);
    const reference = `CRD-${randomUUID()}`;
    const metadata = { planId: plan.id, planName: plan.name };

    await this.paymentsService.recordPayment({
      reference,
      amount,
      purpose: PaymentPurpose.CREDIT_TOPUP,
      status: PaymentStatus.PENDING,
      metadata,
      userId: user.id,
      businessId: user.businessId,
      ...(user.branchId ? { branchId: user.branchId } : {}),
    });

    const checkout = await this.paymentsService.initializeTransaction({
      email: user.email,
      amount: Math.round(amount * 100),
      reference,
      metadata: { ...metadata, purpose: PaymentPurpose.CREDIT_TOPUP },
      callbackUrl,
    });
    if (!checkout) {
      throw new ServiceUnavailableException(
        'Could not start the card payment; try again',
      );
    }
    return {
      reference,
      amount,
      plan: { id: plan.id, name: plan.name },
      accessCode: checkout.access_code,
      authorizationUrl: checkout.authorization_url,
    };
  }

  /** Check a checkout with Paystack and award it if paid (safe to repeat). */
  async confirmCheckout(
    businessId: string | null | undefined,
    reference: string,
  ) {
    const payment = await this.paymentsService.findByReference(reference);
    if (
      !payment ||
      !businessId ||
      payment.purpose !== PaymentPurpose.CREDIT_TOPUP ||
      payment.businessId !== businessId
    ) {
      throw new NotFoundException('Credit purchase not found');
    }
    const completed = await this.completeCheckout(payment);
    return {
      reference,
      status: completed ? ('completed' as const) : ('pending' as const),
      wallet: await this.creditService.getOrCreateWallet(businessId),
    };
  }

  /**
   * Award a paid checkout exactly once. The pending -> success flip is the
   * lock: only the caller that wins it (confirm or webhook) adds credits.
   */
  async completeCheckout(payment: Payment): Promise<boolean> {
    if (payment.status === PaymentStatus.SUCCESS) return true;
    const planId = (payment.metadata as { planId?: string } | null)?.planId;
    if (!planId) return false;

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
    const won = await this.paymentsService.claimPending(payment.reference);
    if (!won) return true;
    const plan = await this.findOne(planId);
    await this.awardPlan(payment.businessId, plan);
    return true;
  }

  async getMyCredits(businessId: string): Promise<BusinessCreditWallet> {
    return this.creditService.getOrCreateWallet(businessId);
  }

  async getRates() {
    const settings = await this.settingsService.getGlobalSettings();
    return {
      creditPriceSms: Number(settings.creditPriceSms) || 15.0,
      creditPriceWhatsapp: Number(settings.creditPriceWhatsapp) || 25.0,
      creditPriceEmail: Number(settings.creditPriceEmail) || 2.0,
      creditPriceAi: Number(settings.creditPriceAi) || 50.0,
    };
  }

  async create(createCreditPlanDto: CreateCreditPlanDto): Promise<CreditPlan> {
    const plan = this.creditPlanRepository.create(createCreditPlanDto);
    return this.creditPlanRepository.save(plan);
  }

  async findAll(): Promise<CreditPlan[]> {
    return this.creditPlanRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<CreditPlan> {
    const plan = await this.creditPlanRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Credit plan with ID ${id} not found`);
    }
    return plan;
  }

  async update(
    id: string,
    updateData: Partial<CreateCreditPlanDto>,
  ): Promise<CreditPlan> {
    await this.findOne(id);
    await this.creditPlanRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.creditPlanRepository.update(id, { isActive: false });
  }
}
