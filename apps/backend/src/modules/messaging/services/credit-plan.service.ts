import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditPlan } from '../entities/credit-plan.entity';
import { CreateCreditPlanDto } from '../dto/create-credit-plan.dto';
import { BusinessCreditWallet } from '../entities/business-credit-wallet.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';
import { Channel } from '../enums/channel.enum';
import { PaymentsService } from '../../payments/payments.service';
import {
  PaymentPurpose,
  PaymentStatus,
} from '../../payments/entities/payment.entity';
import { CreditService } from './credit.service';
import { BranchesService } from '../../branches/branches.service';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class CreditPlanService {
  private readonly logger = new Logger(CreditPlanService.name);
  constructor(
    @InjectRepository(CreditPlan)
    private readonly creditPlanRepository: Repository<CreditPlan>,
    private readonly paymentsService: PaymentsService,
    private readonly creditService: CreditService,
    private readonly branchesService: BranchesService,
    private readonly settingsService: SettingsService,
  ) {}

  async purchaseCustom(
    branchId: string,
    reference: string,
    smsAmount: number,
    whatsappAmount: number,
    emailAmount: number,
    aiAmount: number = 0,
  ): Promise<BusinessCreditWallet> {
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
  ): Promise<BusinessCreditWallet> {
    // Idempotency: check if reference has already been processed
    const existingPayment =
      await this.paymentsService.findByReference(reference);
    if (existingPayment) {
      this.logger.warn(
        `Idempotency triggered: Credit package purchase for reference ${reference} has already been processed.`,
      );
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

    if (plan.smsAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.SMS,
        plan.smsAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Top-up: ${plan.name}`,
      );
    }
    if (plan.emailAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.EMAIL,
        plan.emailAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Top-up: ${plan.name}`,
      );
    }
    if (plan.whatsappAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.WHATSAPP,
        plan.whatsappAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Top-up: ${plan.name}`,
      );
    }
    if (plan.aiAmount > 0) {
      await this.creditService.addCredits(
        businessId,
        Channel.AI,
        plan.aiAmount,
        CreditTransactionType.CREDIT_TOPUP,
        `Top-up: ${plan.name}`,
      );
    }

    return this.creditService.getOrCreateWallet(businessId);
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
