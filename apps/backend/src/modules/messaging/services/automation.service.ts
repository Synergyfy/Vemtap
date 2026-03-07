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
        contactId: log.contactId,
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
      `Triggering automation ${type} for contact ${dto.contactId}`,
    );

    const rules = await this.ruleRepo.find({
      where: {
        branchId: dto.branchId,
        triggerType: type,
        isActive: true,
      },
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
          branchId: rule.branchId,
          channel,
          contactIds: [triggerDto.contactId],
          content: rule.actionConfig?.content,
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
          contactIds: [triggerDto.contactId],
          content,
        });
      }

      const log = this.logRepo.create({
        ruleId: rule.id,
        contactId: triggerDto.contactId,
        status: 'success',
      });
      await this.logRepo.save(log);
    } catch (error: any) {
      this.logger.error(`Rule execution failed: ${error.message}`);
      const log = this.logRepo.create({
        ruleId: rule.id,
        contactId: triggerDto.contactId,
        status: 'failed',
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
