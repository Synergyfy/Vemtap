import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationLog } from '../entities/automation-log.entity';
import { MessagingEngineService } from './messaging-engine.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  AutomationTriggerDto,
  UpdateAutomationToggleDto,
  UpdateAutomationConfigDto,
} from '../dto/automation-rule.dto';
import { TriggerType, ActionType } from '../enums/automation.enum';
import { Channel } from '../enums/channel.enum';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepo: Repository<AutomationRule>,
    @InjectRepository(AutomationLog)
    private readonly logRepo: Repository<AutomationLog>,
    private readonly messagingEngine: MessagingEngineService,
    @InjectQueue('messaging-automation')
    private readonly automationQueue: Queue,
  ) { }

  // --- CRUD ---

  async create(dto: CreateAutomationRuleDto): Promise<AutomationRule> {
    const rule = this.ruleRepo.create(dto);
    return this.ruleRepo.save(rule);
  }

  async findAll(
    businessId: string,
    branchId?: string,
  ): Promise<AutomationRule[]> {
    const where: any = { businessId };
    if (branchId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.branchId = branchId;
    }

    return this.ruleRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<AutomationRule | null> {
    return this.ruleRepo.findOne({ where: { id } });
  }

  async update(
    id: string,
    dto: UpdateAutomationRuleDto,
  ): Promise<AutomationRule> {
    const rule = await this.findOne(id);
    if (!rule) {
      throw new Error('Automation rule not found');
    }
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async toggleAutomation(
    id: string,
    dto: UpdateAutomationToggleDto,
  ): Promise<AutomationRule> {
    const rule = await this.findOne(id);
    if (!rule) {
      throw new Error('Automation rule not found');
    }
    rule.isActive = dto.isActive;
    return this.ruleRepo.save(rule);
  }

  async configureAutomation(
    id: string,
    dto: UpdateAutomationConfigDto,
  ): Promise<AutomationRule> {
    const rule = await this.findOne(id);
    if (!rule) {
      throw new Error('Automation rule not found');
    }

    // Validate variables if content is provided
    if (dto.content) {
      this.validateCustomContent(dto.content);
    }

    // Merge into actionConfig
    rule.actionConfig = {
      ...(rule.actionConfig || {}),
      ...dto,
    };

    // If delayDays is provided, map to delaySeconds (assuming PRD delayDays is standard)
    if (dto.delayDays !== undefined) {
      rule.delaySeconds = dto.delayDays * 24 * 60 * 60;
    }

    return this.ruleRepo.save(rule);
  }

  private validateCustomContent(content: string) {
    if (!content || content.trim() === '') {
      throw new Error('Message content cannot be empty');
    }
    if (content.length > 1024) {
      // General WhatsApp limit or typical limit
      throw new Error('Message is too long');
    }

    const validVariables = [
      '{{business_name}}',
      '{{visitor_name}}',
      '{{loyalty_points}}',
      '{{branch_name}}',
    ];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      if (!validVariables.includes(fullMatch)) {
        throw new Error(
          `Invalid variable found: ${fullMatch}. Allowed variables are: ${validVariables.join(', ')}`,
        );
      }
    }
  }

  async remove(id: string): Promise<void> {
    await this.ruleRepo.delete(id);
  }

  // --- Phase 2: Logs & Connections ---

  async findLogs(businessId: string, branchId?: string, limit = 50, offset = 0) {
    const qb = this.logRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.rule', 'rule')
      .where('rule.businessId = :businessId', { businessId });

    if (branchId) {
      qb.andWhere('(rule.branchId = :branchId OR rule.branchId IS NULL)', { branchId });
    }

    qb.orderBy('log.executedAt', 'DESC')
      .take(limit)
      .skip(offset);

    const [logs, total] = await qb.getManyAndCount();

    // Map to a nice format for the frontend log page
    return {
      data: logs.map(log => ({
        id: log.id,
        ruleName: log.rule?.name,
        contactId: log.contactId,
        status: log.status,
        executedAt: log.executedAt,
        errorReason: log.errorReason,
      })),
      total,
    };
  }

  async findLogDetails(logId: string, businessId: string) {
    const log = await this.logRepo.findOne({
      where: { id: logId },
      relations: ['rule'],
    });

    if (!log) {
      throw new Error('Log not found');
    }

    if (log.rule?.businessId !== businessId) {
      throw new Error('Access denied');
    }

    return log;
  }

  async getConnectionStatus(businessId: string, branchId?: string) {
    // In a real implementation, you would check the business's WhatsApp Cloud API
    // or external provider connection status via MessagingEngineService.
    // For now, return a mock connected state.
    return {
      status: 'Connected', // 'Connected' or 'Disconnected'
      provider: 'WhatsApp',
      updatedAt: new Date(),
    };
  }

  // --- Phase 3: Analytics ---

  async getPerformanceAnalytics(businessId: string, branchId?: string, startDate?: Date, endDate?: Date) {
    const qb = this.logRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.rule', 'rule')
      .where('rule.businessId = :businessId', { businessId });

    if (branchId) {
      qb.andWhere('(rule.branchId = :branchId OR rule.branchId IS NULL)', { branchId });
    }

    if (startDate) {
      qb.andWhere('log.executedAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.executedAt <= :endDate', { endDate });
    }

    const logs = await qb.getMany();

    const totalMessagesSent = logs.filter(l => l.status === 'success').length;
    const totalFailures = logs.filter(l => l.status === 'failed').length;

    // We don't have reply tracking yet in log entity, so this is mocked/placeholder
    const totalRepliesReceived = 0;
    const replyRate = totalMessagesSent > 0 ? (totalRepliesReceived / totalMessagesSent) * 100 : 0;

    // Calculate sum of loyalty points issued from successful logs
    let loyaltyPointsIssued = 0;
    for (const log of logs) {
      if (log.status === 'success' && log.rule?.actionConfig?.loyaltyPoints) {
        loyaltyPointsIssued += Number(log.rule.actionConfig.loyaltyPoints) || 0;
      }
    }

    const activeRulesCount = await this.ruleRepo.count({
      where: { businessId, isActive: true, ...(branchId ? { branchId } : {}) }
    });

    return {
      totalMessagesSent,
      totalFailures,
      totalRepliesReceived,
      replyRate: Number(replyRate.toFixed(2)),
      loyaltyPointsIssued,
      activeAutomationsCount: activeRulesCount,
    };
  }

  // --- Logic ---

  async trigger(type: TriggerType, dto: AutomationTriggerDto): Promise<void> {
    this.logger.log(
      `Triggering automation ${type} for contact ${dto.contactId}`,
    );

    const whereConditions: any[] = [
      {
        businessId: dto.businessId,
        branchId: dto.branchId,
        triggerType: type,
        isActive: true,
      },
    ];
    // Include global business rules if specific branch rules don't override (or in addition? typically in addition)
    // The query finds ALL matching rules.
    if (dto.branchId) {
      whereConditions.push({
        businessId: dto.businessId,
        branchId: IsNull(),
        triggerType: type,
        isActive: true,
      });
    } else {
      // If no branchId in trigger, only look for global rules or handle appropriately
      whereConditions.push({
        businessId: dto.businessId,
        branchId: IsNull(),
        triggerType: type,
        isActive: true,
      });
    }

    const rules = await this.ruleRepo.find({
      where: whereConditions,
    });

    this.logger.log(`Found ${rules.length} matching rules`);

    for (const rule of rules) {
      if (rule.delaySeconds && rule.delaySeconds > 0) {
        this.logger.log(
          `Queuing delayed execution for rule ${rule.id} (${rule.delaySeconds}s)`,
        );
        await this.automationQueue.add(
          'execute-rule',
          {
            ruleId: rule.id,
            triggerDto: dto,
          },
          {
            delay: rule.delaySeconds * 1000,
          },
        );
      } else {
        await this.executeRule(rule.id, dto);
      }
    }
  }

  async executeRule(
    ruleId: string,
    triggerDto: AutomationTriggerDto,
  ): Promise<void> {
    const rule = await this.ruleRepo.findOne({ where: { id: ruleId } });
    if (!rule || !rule.isActive) return;

    this.logger.log(
      `Executing rule ${rule.id} (${rule.name}) for contact ${triggerDto.contactId}`,
    );

    try {
      if (
        rule.actionType === ActionType.SEND_SMS ||
        rule.actionType === ActionType.SEND_WHATSAPP ||
        rule.actionType === ActionType.SEND_EMAIL
      ) {
        const channel = this.mapActionToChannel(rule.actionType);
        await this.messagingEngine.sendMessage({
          businessId: rule.businessId,
          branchId: rule.branchId || triggerDto.branchId,
          channel,
          contactIds: [triggerDto.contactId],
          content: rule.actionConfig?.content,
          templateId: rule.actionConfig?.templateId,
        });
      } else if (rule.actionType === ActionType.PUSH_REVIEW) {
        // Push Review Logic
        const reviewLink =
          rule.actionConfig?.reviewLink || 'https://google.com/review';
        const content =
          rule.actionConfig?.content ||
          `Thanks for visiting! Please review us here: ${reviewLink}`;

        // Default to SMS if not specified? Or check user preference?
        // For simplicity, default to SMS or WhatsApp if available.
        // Assuming SMS for now as fallback.
        await this.messagingEngine.sendMessage({
          businessId: rule.businessId,
          branchId: rule.branchId || triggerDto.branchId,
          channel: Channel.SMS,
          contactIds: [triggerDto.contactId],
          content,
        });
      }

      // Log success
      const log = this.logRepo.create({
        ruleId: rule.id,
        contactId: triggerDto.contactId,
        status: 'success',
      });
      await this.logRepo.save(log);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Rule execution failed: ${error.message}`);
      const log = this.logRepo.create({
        ruleId: rule.id,
        contactId: triggerDto.contactId,
        status: 'failed',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        errorReason: error.message,
      });
      await this.logRepo.save(log);
    }
  }

  private mapActionToChannel(action: ActionType): Channel {
    if (action === ActionType.SEND_SMS) return Channel.SMS;
    if (action === ActionType.SEND_WHATSAPP) return Channel.WHATSAPP;
    if (action === ActionType.SEND_EMAIL) return Channel.EMAIL;
    return Channel.SMS;
  }
}
