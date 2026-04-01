import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepo: Repository<AutomationRule>,
    @InjectRepository(AutomationLog)
    private readonly logRepo: Repository<AutomationLog>,
    private readonly messagingEngine: MessagingEngineService,
    private readonly branchesService: BranchesService,
    @InjectQueue('messaging-automation')
    private readonly automationQueue: Queue,
  ) {}

  async checkBranchAccess(user: any, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  // --- CRUD ---

  async create(dto: CreateAutomationRuleDto): Promise<AutomationRule> {
    if (!dto.businessId) {
      const branch = await this.branchesService.findById(dto.branchId);
      dto.businessId = branch.businessId;
    }
    const rule = this.ruleRepo.create(dto as any) as unknown as AutomationRule;
    return this.ruleRepo.save(rule);
  }

  async findAll(branchId: string): Promise<AutomationRule[]> {
    return this.ruleRepo.find({
      where: { branchId },
      order: { createdAt: 'DESC' },
    });
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

    if (dto.content) {
      this.validateCustomContent(dto.content);
    }

    rule.actionConfig = {
      ...(rule.actionConfig || {}),
      ...dto,
    };

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

  // --- Logs & Connections ---

  async findLogs(branchId: string, limit = 50, offset = 0) {
    const qb = this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.rule', 'rule')
      .where('rule.branchId = :branchId', { branchId });

    qb.orderBy('log.executedAt', 'DESC').take(limit).skip(offset);

    const [logs, total] = await qb.getManyAndCount();

    return {
      data: logs.map((log) => ({
        id: log.id,
        ruleName: log.rule?.name,
        customerId: log.customerId,
        status: log.status,
        executedAt: log.executedAt,
        errorReason: log.errorReason,
      })),
      total,
    };
  }

  async findLogDetails(logId: string, branchId: string) {
    const log = await this.logRepo.findOne({
      where: { id: logId },
      relations: ['rule'],
    });

    if (!log) {
      throw new Error('Log not found');
    }

    if (log.rule?.branchId !== branchId) {
      throw new Error('Access denied');
    }

    return log;
  }

  async getConnectionStatus(branchId: string) {
    return {
      status: 'Connected',
      provider: 'WhatsApp',
      updatedAt: new Date(),
    };
  }

  // --- Analytics ---

  async getPerformanceAnalytics(
    branchId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const qb = this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.rule', 'rule')
      .where('rule.branchId = :branchId', { branchId });

    if (startDate) {
      qb.andWhere('log.executedAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.executedAt <= :endDate', { endDate });
    }

    const logs = await qb.getMany();

    const totalMessagesSent = logs.filter((l) => l.status === 'success').length;
    const totalFailures = logs.filter((l) => l.status === 'failed').length;

    const totalRepliesReceived = 0;
    const replyRate =
      totalMessagesSent > 0
        ? (totalRepliesReceived / totalMessagesSent) * 100
        : 0;

    let loyaltyPointsIssued = 0;
    for (const log of logs) {
      if (log.status === 'success' && log.rule?.actionConfig?.loyaltyPoints) {
        loyaltyPointsIssued += Number(log.rule.actionConfig.loyaltyPoints) || 0;
      }
    }

    const activeRulesCount = await this.ruleRepo.count({
      where: { branchId, isActive: true },
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
      `Triggering automation ${type} for customer ${dto.customerId}`,
    );

    const rules = await this.ruleRepo.find({
      where: {
        branchId: dto.branchId,
        triggerType: type,
        isActive: true,
      },
    });

    this.logger.log(`Found ${rules.length} matching rules for ${type}`);

    for (const rule of rules) {
      // 1. Check for Keyword Matching (FAQ)
      if (type === TriggerType.INBOUND_MESSAGE && dto.content) {
        const keywords = rule.actionConfig?.keywords || [];
        if (keywords.length > 0) {
          const content = dto.content.toLowerCase();
          const matches = keywords.some((kw: string) =>
            content.includes(kw.toLowerCase()),
          );
          if (!matches) {
            this.logger.log(`Rule ${rule.id} keywords do not match message content`);
            continue;
          }
        }
      }

      // 2. Check for Off-Hours
      if (type === TriggerType.OFF_HOURS) {
        const branch = await this.branchesService.findById(dto.branchId);
        if (!this.isCurrentlyOffHours(branch)) {
          this.logger.log(`Branch ${dto.branchId} is currently OPEN; skipping off-hours automation.`);
          continue;
        }
      }

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

  private isCurrentlyOffHours(branch: any): boolean {
    if (!branch.businessHours) return false;

    const now = new Date();
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const currentDay = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const todayConfig = branch.businessHours[currentDay];
    if (!todayConfig || !todayConfig.isOpen) return true;

    if (todayConfig.startTime && todayConfig.endTime) {
      return currentTime < todayConfig.startTime || currentTime > todayConfig.endTime;
    }

    return false;
  }

  async executeRule(
    ruleId: string,
    triggerDto: AutomationTriggerDto,
  ): Promise<void> {
    const rule = await this.ruleRepo.findOne({ where: { id: ruleId } });
    if (!rule || !rule.isActive) return;

    this.logger.log(
      `Executing rule ${rule.id} (${rule.name}) for customer ${triggerDto.customerId}`,
    );

    try {
      if (
        rule.actionType === ActionType.SEND_SMS ||
        rule.actionType === ActionType.SEND_WHATSAPP ||
        rule.actionType === ActionType.SEND_EMAIL ||
        rule.actionType === ActionType.SEND_IN_HOUSE
      ) {
        const channel = this.mapActionToChannel(rule.actionType);
        await this.messagingEngine.sendMessage({
          branchId: rule.branchId,
          channel,
          customerIds: [triggerDto.customerId],
          content: rule.actionConfig?.content || rule.actionConfig?.message,
          templateId: rule.actionConfig?.templateId,
        });
      } else if (rule.actionType === ActionType.PUSH_REVIEW) {
        const reviewLink =
          rule.actionConfig?.reviewLink || 'https://google.com/review';
        const content =
          rule.actionConfig?.content ||
          `Thanks for visiting! Please review us here: ${reviewLink}`;

        await this.messagingEngine.sendMessage({
          branchId: rule.branchId,
          channel: Channel.SMS,
          customerIds: [triggerDto.customerId],
          content,
        });
      }

      const log = this.logRepo.create({
        ruleId: rule.id,
        customerId: triggerDto.customerId,
        status: 'success',
      } as any) as unknown as AutomationLog;
      await this.logRepo.save(log);
    } catch (error: any) {
      this.logger.error(`Rule execution failed: ${error.message}`);
      const log = this.logRepo.create({
        ruleId: rule.id,
        customerId: triggerDto.customerId,
        status: 'failed',
        errorReason: error.message,
      } as any) as unknown as AutomationLog;
      await this.logRepo.save(log);
    }
  }

  private mapActionToChannel(action: ActionType): Channel {
    if (action === ActionType.SEND_SMS) return Channel.SMS;
    if (action === ActionType.SEND_WHATSAPP) return Channel.WHATSAPP;
    if (action === ActionType.SEND_EMAIL) return Channel.EMAIL;
    if (action === ActionType.SEND_IN_HOUSE) return Channel.IN_HOUSE;
    return Channel.SMS;
  }
}
