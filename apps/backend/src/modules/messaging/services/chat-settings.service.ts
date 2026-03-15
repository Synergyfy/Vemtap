import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';
import { ChatCategory } from '../entities/chat-category.entity';
import { TriggerType, ActionType } from '../enums/automation.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ChatSettingsService {
  constructor(
    @InjectRepository(AutomationRule)
    private readonly automationRepo: Repository<AutomationRule>,
    @InjectRepository(ChatCategory)
    private readonly categoryRepo: Repository<ChatCategory>,
  ) {}

  // --- Automation / Automated Replies ---

  async getAutomatedReplies(branchId: string) {
    const rules = await this.automationRepo.find({
      where: {
        branchId,
        triggerType: TriggerType.WELCOME_MESSAGE || TriggerType.OFF_HOURS || TriggerType.INBOUND_MESSAGE,
      },
    });

    // To make it easy for frontend, we can format this
    const welcome = rules.find(r => r.triggerType === TriggerType.WELCOME_MESSAGE);
    const offHours = rules.find(r => r.triggerType === TriggerType.OFF_HOURS);
    const faqs = rules.filter(r => r.triggerType === TriggerType.INBOUND_MESSAGE);

    return {
      welcomeEnabled: welcome?.isActive ?? false,
      welcomeMessage: welcome?.actionConfig?.message ?? '',
      offHoursEnabled: offHours?.isActive ?? false,
      offHoursMessage: offHours?.actionConfig?.message ?? '',
      offHoursSchedule: offHours?.actionConfig?.schedule ?? 'Outside Business Hours',
      faqEnabled: faqs.length > 0,
      faqKeywords: faqs.map(f => ({
        id: f.id,
        keywords: f.actionConfig?.keywords ?? [],
        response: f.actionConfig?.message ?? '',
        enabled: f.isActive,
      })),
    };
  }

  async updateAutomatedReplies(branchId: string, dto: any) {
    if (dto.welcomeEnabled !== undefined || dto.welcomeMessage !== undefined) {
      await this.upsertRule(branchId, TriggerType.WELCOME_MESSAGE, {
        isActive: dto.welcomeEnabled,
        message: dto.welcomeMessage,
      });
    }

    if (dto.offHoursEnabled !== undefined || dto.offHoursMessage !== undefined || dto.offHoursSchedule !== undefined) {
      await this.upsertRule(branchId, TriggerType.OFF_HOURS, {
        isActive: dto.offHoursEnabled,
        message: dto.offHoursMessage,
        schedule: dto.offHoursSchedule,
      });
    }

    return this.getAutomatedReplies(branchId);
  }

  private async upsertRule(branchId: string, triggerType: TriggerType, config: any) {
    let rule = await this.automationRepo.findOne({
      where: { branchId, triggerType },
    });

    if (!rule) {
      rule = this.automationRepo.create({
        branchId,
        triggerType,
        name: triggerType.replace('_', ' ').toUpperCase(),
        actionType: ActionType.SEND_IN_HOUSE,
        actionConfig: {},
      });
    }

    if (config.isActive !== undefined) rule.isActive = config.isActive;
    rule.actionConfig = { ...rule.actionConfig, ...config };
    delete rule.actionConfig.isActive; // Clean up

    return this.automationRepo.save(rule);
  }

  // --- FAQ Keywords ---

  async addFaqKeyword(branchId: string, dto: any) {
    const rule = this.automationRepo.create({
      branchId,
      triggerType: TriggerType.INBOUND_MESSAGE,
      name: 'FAQ Trigger',
      actionType: ActionType.SEND_IN_HOUSE,
      isActive: true,
      actionConfig: {
        keywords: dto.keywords,
        message: dto.response,
      },
    });
    return this.automationRepo.save(rule);
  }

  async updateFaqKeyword(id: string, branchId: string, dto: any) {
    const rule = await this.automationRepo.findOne({ where: { id, branchId } });
    if (!rule) throw new NotFoundException('FAQ trigger not found');

    if (dto.enabled !== undefined) rule.isActive = dto.enabled;
    rule.actionConfig = {
      ...rule.actionConfig,
      keywords: dto.keywords ?? rule.actionConfig.keywords,
      message: dto.response ?? rule.actionConfig.message,
    };
    return this.automationRepo.save(rule);
  }

  async deleteFaqKeyword(id: string, branchId: string) {
    const rule = await this.automationRepo.findOne({ where: { id, branchId } });
    if (!rule) throw new NotFoundException('FAQ trigger not found');
    await this.automationRepo.remove(rule);
  }

  // --- Categories ---

  async getCategories(branchId: string) {
    return this.categoryRepo.find({ where: { branchId } });
  }

  async createCategory(branchId: string, dto: any) {
    const category = this.categoryRepo.create({
      branchId,
      ...dto,
      slug: dto.name.toLowerCase().replace(/ /g, '-'),
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, branchId: string, dto: any) {
    const category = await this.categoryRepo.findOne({ where: { id, branchId } });
    if (!category) throw new NotFoundException('Category not found');

    Object.assign(category, dto);
    if (dto.name) category.slug = dto.name.toLowerCase().replace(/ /g, '-');
    
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string, branchId: string) {
    const category = await this.categoryRepo.findOne({ where: { id, branchId } });
    if (!category) throw new NotFoundException('Category not found');
    await this.categoryRepo.remove(category);
  }
}
