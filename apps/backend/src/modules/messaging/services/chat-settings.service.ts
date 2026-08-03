import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';
import { ChatCategory } from '../entities/chat-category.entity';
import { TriggerType, ActionType } from '../enums/automation.enum';
import {
  UpdateChatAutomationDto,
  AddFaqKeywordDto,
  UpdateFaqKeywordDto,
} from '../dto/chat-automation.dto';
import {
  CreateChatCategoryDto,
  UpdateChatCategoryDto,
} from '../dto/chat-category.dto';

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
      },
    });

    const welcome = rules.find(
      (r) => r.triggerType === TriggerType.WELCOME_MESSAGE,
    );
    const offHours = rules.find((r) => r.triggerType === TriggerType.OFF_HOURS);
    const faqs = rules.filter(
      (r) => r.triggerType === TriggerType.INBOUND_MESSAGE,
    );

    return {
      welcomeEnabled: welcome?.isActive ?? false,
      welcomeMessage: welcome?.actionConfig?.message ?? '',
      offHoursEnabled: offHours?.isActive ?? false,
      offHoursMessage: offHours?.actionConfig?.message ?? '',
      offHoursSchedule:
        offHours?.actionConfig?.schedule ?? 'Outside Business Hours',
      customSchedule: offHours?.actionConfig?.customSchedule ?? null,
      faqEnabled: faqs.length > 0,
      faqKeywords: faqs.map((f) => ({
        id: f.id,
        keywords: f.actionConfig?.keywords ?? [],
        response: f.actionConfig?.message ?? '',
        enabled: f.isActive,
      })),
    };
  }

  async updateAutomatedReplies(branchId: string, dto: UpdateChatAutomationDto) {
    if (dto.welcomeEnabled !== undefined || dto.welcomeMessage !== undefined) {
      await this.upsertRule(branchId, TriggerType.WELCOME_MESSAGE, {
        isActive: dto.welcomeEnabled,
        message: dto.welcomeMessage,
      });
    }

    if (
      dto.offHoursEnabled !== undefined ||
      dto.offHoursMessage !== undefined ||
      dto.offHoursSchedule !== undefined ||
      dto.customSchedule !== undefined
    ) {
      if (dto.offHoursSchedule === 'Custom Schedule' && dto.customSchedule) {
        this.validateCustomSchedule(dto.customSchedule);
      }

      await this.upsertRule(branchId, TriggerType.OFF_HOURS, {
        isActive: dto.offHoursEnabled,
        message: dto.offHoursMessage,
        schedule: dto.offHoursSchedule,
        customSchedule: dto.customSchedule,
      });
    }

    return this.getAutomatedReplies(branchId);
  }

  private validateCustomSchedule(schedule: {
    days?: Record<string, { startTime: string; endTime: string }>;
  }) {
    if (!schedule.days || typeof schedule.days !== 'object') {
      throw new BadRequestException(
        'Invalid custom schedule format: days required',
      );
    }

    const validDays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    for (const [day, config] of Object.entries(schedule.days)) {
      if (!validDays.includes(day.toLowerCase())) {
        throw new BadRequestException(`Invalid day: ${day}`);
      }

      const { startTime, endTime } = config;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new BadRequestException(
          `Invalid time format for ${day}. Use HH:mm`,
        );
      }
    }
  }

  private async upsertRule(
    branchId: string,
    triggerType: TriggerType,
    config: any,
  ) {
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

    // Merge only the keys provided in config
    const currentConfig = rule.actionConfig || {};
    rule.actionConfig = {
      ...currentConfig,
      ...config,
    };

    // Clean up isActive if it accidentally got into actionConfig
    delete rule.actionConfig.isActive;

    return this.automationRepo.save(rule);
  }

  // --- FAQ Keywords ---

  async addFaqKeyword(branchId: string, dto: AddFaqKeywordDto) {
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

  async updateFaqKeyword(
    id: string,
    branchId: string,
    dto: UpdateFaqKeywordDto,
  ) {
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

  async createCategory(branchId: string, dto: CreateChatCategoryDto) {
    const category = this.categoryRepo.create({
      branchId,
      ...dto,
      slug: dto.name.toLowerCase().replace(/ /g, '-'),
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(
    id: string,
    branchId: string,
    dto: UpdateChatCategoryDto,
  ) {
    const category = await this.categoryRepo.findOne({
      where: { id, branchId },
    });
    if (!category) throw new NotFoundException('Category not found');

    Object.assign(category, dto);
    if (dto.name) category.slug = dto.name.toLowerCase().replace(/ /g, '-');

    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string, branchId: string) {
    const category = await this.categoryRepo.findOne({
      where: { id, branchId },
    });
    if (!category) throw new NotFoundException('Category not found');
    await this.categoryRepo.remove(category);
  }
}
