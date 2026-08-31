import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { SavePlanPermissionsDto } from './dto/save-plan-permissions.dto';
import { PricingUtil } from './utils/pricing.util';
import { SubscriptionTaxService } from './services/subscription-tax.service';
import {
  SubscriptionTaxConfig,
  TaxType,
} from './entities/subscription-tax-config.entity';

export interface PlanPricingCycle {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
}

export interface PlanTaxInfo {
  name: string;
  taxType: TaxType;
  rate: number;
  isEnabled: boolean;
}

export interface PlanWithTax extends Plan {
  tax: PlanTaxInfo;
  monthlyTax: number;
  monthlyPriceWithTax: number;
  quarterlyTax: number;
  quarterlyPriceWithTax: number;
  yearlyTax: number;
  yearlyPriceWithTax: number;
  pricing: {
    tax: PlanTaxInfo;
    monthly: PlanPricingCycle;
    quarterly: PlanPricingCycle;
    yearly: PlanPricingCycle;
  };
}

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly subscriptionTaxService: SubscriptionTaxService,
  ) {}

  private sanitizePlanDefaults(plan: Plan): void {
    if (plan.aiCredits === null || plan.aiCredits === undefined) {
      plan.aiCredits = 0;
    }
    if (plan.smsCredits === null || plan.smsCredits === undefined) {
      plan.smsCredits = 0;
    }
    if (plan.emailCredits === null || plan.emailCredits === undefined) {
      plan.emailCredits = 0;
    }
    if (plan.whatsappCredits === null || plan.whatsappCredits === undefined) {
      plan.whatsappCredits = 0;
    }
    if (plan.branchLimit === null || plan.branchLimit === undefined) {
      plan.branchLimit = 1;
    }
    if (
      plan.trialDurationDays === null ||
      plan.trialDurationDays === undefined
    ) {
      plan.trialDurationDays = 30;
    }
  }

  enrichPlanWithTax(
    plan: Plan,
    taxConfig: SubscriptionTaxConfig,
  ): PlanWithTax {
    const taxInfo: PlanTaxInfo = {
      name: taxConfig?.name || 'VAT',
      taxType: taxConfig?.taxType || TaxType.PERCENTAGE,
      rate: Number(taxConfig?.rate || 0),
      isEnabled: Boolean(taxConfig?.isEnabled),
    };

    if (plan.isFree) {
      const zeroCycle: PlanPricingCycle = {
        basePrice: 0,
        taxAmount: 0,
        totalPrice: 0,
      };
      return {
        ...plan,
        tax: taxInfo,
        monthlyTax: 0,
        monthlyPriceWithTax: 0,
        quarterlyTax: 0,
        quarterlyPriceWithTax: 0,
        yearlyTax: 0,
        yearlyPriceWithTax: 0,
        pricing: {
          tax: taxInfo,
          monthly: zeroCycle,
          quarterly: zeroCycle,
          yearly: zeroCycle,
        },
      };
    }

    const monthlyPrice = Number(plan.monthlyPrice) || 0;
    const quarterlyPrice = Number(plan.quarterlyPrice) || 0;
    const yearlyPrice = Number(plan.yearlyPrice) || 0;

    const monthlyCalc = this.subscriptionTaxService.calculateTax(
      monthlyPrice,
      taxConfig,
    );
    const quarterlyCalc = this.subscriptionTaxService.calculateTax(
      quarterlyPrice,
      taxConfig,
    );
    const yearlyCalc = this.subscriptionTaxService.calculateTax(
      yearlyPrice,
      taxConfig,
    );

    return {
      ...plan,
      tax: taxInfo,
      monthlyTax: monthlyCalc.taxAmount,
      monthlyPriceWithTax: monthlyCalc.total,
      quarterlyTax: quarterlyCalc.taxAmount,
      quarterlyPriceWithTax: quarterlyCalc.total,
      yearlyTax: yearlyCalc.taxAmount,
      yearlyPriceWithTax: yearlyCalc.total,
      pricing: {
        tax: taxInfo,
        monthly: {
          basePrice: monthlyCalc.subtotal,
          taxAmount: monthlyCalc.taxAmount,
          totalPrice: monthlyCalc.total,
        },
        quarterly: {
          basePrice: quarterlyCalc.subtotal,
          taxAmount: quarterlyCalc.taxAmount,
          totalPrice: quarterlyCalc.total,
        },
        yearly: {
          basePrice: yearlyCalc.subtotal,
          taxAmount: yearlyCalc.taxAmount,
          totalPrice: yearlyCalc.total,
        },
      },
    };
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create(createPlanDto);

    const monthly = Number(plan.monthlyPrice) || 0;
    plan.monthlyPrice = monthly;
    plan.quarterlyPrice = PricingUtil.calculateQuarterlyPrice(monthly);
    plan.yearlyPrice = PricingUtil.calculateYearlyPrice(monthly);
    this.sanitizePlanDefaults(plan);

    return this.planRepository.save(plan);
  }

  async findFreePlan(): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: { isFree: true, isActive: true },
    });
  }

  async findAll(onlyActive: boolean = false): Promise<PlanWithTax[]> {
    const where = onlyActive ? { isActive: true } : {};
    const plans = await this.planRepository.find({
      where,
      order: { monthlyPrice: 'ASC' },
    });
    const taxConfig = await this.subscriptionTaxService.getActiveConfig();
    return plans.map((p) => this.enrichPlanWithTax(p, taxConfig));
  }

  async findEntityById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return plan;
  }

  async findOne(id: string): Promise<PlanWithTax> {
    const plan = await this.findEntityById(id);
    const taxConfig = await this.subscriptionTaxService.getActiveConfig();
    return this.enrichPlanWithTax(plan, taxConfig);
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findEntityById(id);
    Object.assign(plan, updatePlanDto);

    const monthly = Number(plan.monthlyPrice) || 0;
    plan.monthlyPrice = monthly;
    plan.quarterlyPrice = PricingUtil.calculateQuarterlyPrice(monthly);
    plan.yearlyPrice = PricingUtil.calculateYearlyPrice(monthly);
    this.sanitizePlanDefaults(plan);

    return this.planRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findEntityById(id);
    await this.planRepository.softRemove(plan);
  }

  async updatePermissions(
    id: string,
    dto: SavePlanPermissionsDto,
  ): Promise<Plan> {
    const plan = await this.findEntityById(id);
    Object.assign(plan, dto);
    this.sanitizePlanDefaults(plan);
    plan.permissionsConfiguredAt = new Date();
    return this.planRepository.save(plan);
  }

  async getPermissions(id: string): Promise<Partial<Plan>> {
    const plan = await this.findEntityById(id);
    const permissionFields: (keyof Plan)[] = [
      'messagingEnabled',
      'smsCredits',
      'whatsappCredits',
      'emailCredits',
      'teamMembersEnabled',
      'teamMembersLimit',
      'loyaltyEnabled',
      'loyaltyLimit',
      'branchesEnabled',
      'branchLimit',
      'analyticsEnabled',
      'analyticsLevel',
      'catalogueEnabled',
      'maxCatalogueItems',
      'maxCatalogueCategories',
      'maxCatalogueOffers',
      'automationsEnabled',
      'maxAutomations',
      'inventoryEnabled',
      'inventoryLimit',
      'posEnabled',
      'posTerminalLimit',
      'visitorsEnabled',
      'inAppChatEnabled',
      'formsEnabled',
      'formsLimit',
      'businessQrEnabled',
      'marketingKitEnabled',
      'marketingKitLimit',
      'discoveryEnabled',
      'staffRolesEnabled',
      'staffRolesLimit',
      'activityLogEnabled',
      'qrCodesEnabled',
      'qrCodesLimit',
      'aiCopilotEnabled',
      'aiCredits',
      'autoFeatureDeals',
      'permissionsConfiguredAt',
    ];
    const result: Partial<Plan> = { id: plan.id };
    for (const field of permissionFields) {
      (result as any)[field] = plan[field];
    }
    return result;
  }
}
