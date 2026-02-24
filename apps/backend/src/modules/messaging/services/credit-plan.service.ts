import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditPlan } from '../entities/credit-plan.entity';
import { CreateCreditPlanDto } from '../dto/create-credit-plan.dto';
import { BusinessCredit } from '../entities/business-credit.entity';
import { PaymentsService } from '../../payments/payments.service';
import { PaymentPurpose, PaymentStatus } from '../../payments/entities/payment.entity';

@Injectable()
export class CreditPlanService {
    private readonly logger = new Logger(CreditPlanService.name);
    constructor(
        @InjectRepository(CreditPlan)
        private readonly creditPlanRepository: Repository<CreditPlan>,
        @InjectRepository(BusinessCredit)
        private readonly businessCreditRepo: Repository<BusinessCredit>,
        private readonly paymentsService: PaymentsService,
    ) { }

    async purchase(businessId: string, planId: string, reference: string): Promise<BusinessCredit> {
        const plan = await this.findOne(planId);

        // Verify payment with Paystack
        const paymentData = await this.paymentsService.verifyTransaction(reference);
        if (!paymentData) {
            this.logger.error(`Payment verification failed for reference: ${reference}`);
            throw new BadRequestException('Payment verification failed. Please check your transaction reference.');
        }

        // Check if amount matches
        const paidAmount = Math.round(paymentData.amount / 100);
        if (paidAmount < Math.round(plan.price)) {
            this.logger.warn(`Insufficient payment for plan ${planId}. Expected ${plan.price}, got ${paidAmount}`);
            throw new BadRequestException(`Insufficient payment amount. Expected ${plan.price}, but verified payment was ${paidAmount}`);
        }

        // Record the payment
        await this.paymentsService.recordPayment({
            reference,
            amount: plan.price,
            purpose: 'CREDIT_TOPUP' as PaymentPurpose,
            status: PaymentStatus.SUCCESS,
            businessId,
            metadata: { planId, ...plan },
        });

        // Award credits
        let credits = await this.businessCreditRepo.findOne({ where: { businessId } });
        if (!credits) {
            credits = this.businessCreditRepo.create({
                businessId,
                smsBalance: 0,
                emailBalance: 0,
                whatsappBalance: 0,
            });
        }

        credits.smsBalance += Number(plan.smsAmount);
        credits.emailBalance += Number(plan.emailAmount);
        credits.whatsappBalance += Number(plan.whatsappAmount);

        return this.businessCreditRepo.save(credits);
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

    async update(id: string, updateData: Partial<CreateCreditPlanDto>): Promise<CreditPlan> {
        await this.findOne(id);
        await this.creditPlanRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.creditPlanRepository.update(id, { isActive: false });
    }
}
