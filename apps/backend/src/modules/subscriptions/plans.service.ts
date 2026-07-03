import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { SavePlanPermissionsDto } from './dto/save-plan-permissions.dto';
import { PricingUtil } from './utils/pricing.util';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create(createPlanDto);

    const monthly = Number(plan.monthlyPrice) || 0;
    plan.monthlyPrice = monthly;
    plan.quarterlyPrice = PricingUtil.calculateQuarterlyPrice(monthly);
    plan.yearlyPrice = PricingUtil.calculateYearlyPrice(monthly);

    return this.planRepository.save(plan);
  }

  async findFreePlan(): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: { isFree: true, isActive: true },
    });
  }

  async findAll(onlyActive: boolean = false): Promise<Plan[]> {
    const where = onlyActive ? { isActive: true } : {};
    return this.planRepository.find({ where, order: { monthlyPrice: 'ASC' } });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    Object.assign(plan, updatePlanDto);

    const monthly = Number(plan.monthlyPrice) || 0;
    plan.monthlyPrice = monthly;
    plan.quarterlyPrice = PricingUtil.calculateQuarterlyPrice(monthly);
    plan.yearlyPrice = PricingUtil.calculateYearlyPrice(monthly);

    return this.planRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepository.softRemove(plan);
  }

  async updatePermissions(
    id: string,
    dto: SavePlanPermissionsDto,
  ): Promise<Plan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    plan.permissionsConfiguredAt = new Date();
    return this.planRepository.save(plan);
  }

  async getPermissions(id: string): Promise<Partial<Plan>> {
    const plan = await this.findOne(id);
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
      'permissionsConfiguredAt',
    ];
    const result: Partial<Plan> = { id: plan.id };
    for (const field of permissionFields) {
      (result as any)[field] = plan[field];
    }
    return result;
  }
}
