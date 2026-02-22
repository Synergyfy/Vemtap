import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationLog } from '../entities/automation-log.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto, AutomationTriggerDto } from '../dto/automation-rule.dto';
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
    @InjectQueue('messaging-automation') private readonly automationQueue: Queue,
  ) {}

  // --- CRUD ---

  async create(dto: CreateAutomationRuleDto): Promise<AutomationRule> {
    const rule = this.ruleRepo.create(dto);
    return this.ruleRepo.save(rule);
  }

  async findAll(businessId: string, branchId?: string): Promise<AutomationRule[]> {
    const where: any = { businessId };
    if (branchId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.branchId = branchId;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.ruleRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<AutomationRule | null> {
    return this.ruleRepo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateAutomationRuleDto): Promise<AutomationRule> {
    const rule = await this.findOne(id);
    if (!rule) {
        throw new Error('Automation rule not found');
    }
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async remove(id: string): Promise<void> {
    await this.ruleRepo.delete(id);
  }

  // --- Logic ---

  async trigger(type: TriggerType, dto: AutomationTriggerDto): Promise<void> {
    this.logger.log(`Triggering automation ${type} for contact ${dto.contactId}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const whereConditions: any[] = [
        { businessId: dto.businessId, branchId: dto.branchId, triggerType: type, isActive: true },
    ];
    // Include global business rules if specific branch rules don't override (or in addition? typically in addition)
    // The query finds ALL matching rules.
    if (dto.branchId) {
        whereConditions.push({ businessId: dto.businessId, branchId: IsNull(), triggerType: type, isActive: true });
    } else {
         // If no branchId in trigger, only look for global rules or handle appropriately
         whereConditions.push({ businessId: dto.businessId, branchId: IsNull(), triggerType: type, isActive: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const rules = await this.ruleRepo.find({
        where: whereConditions
    });

    this.logger.log(`Found ${rules.length} matching rules`);

    for (const rule of rules) {
         if (rule.delaySeconds && rule.delaySeconds > 0) {
             this.logger.log(`Queuing delayed execution for rule ${rule.id} (${rule.delaySeconds}s)`);
             await this.automationQueue.add('execute-rule', {
                 ruleId: rule.id,
                 triggerDto: dto
             }, {
                 delay: rule.delaySeconds * 1000
             });
         } else {
             await this.executeRule(rule.id, dto);
         }
    }
  }

  async executeRule(ruleId: string, triggerDto: AutomationTriggerDto): Promise<void> {
      const rule = await this.ruleRepo.findOne({ where: { id: ruleId } });
      if (!rule || !rule.isActive) return;

      this.logger.log(`Executing rule ${rule.id} (${rule.name}) for contact ${triggerDto.contactId}`);

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
                  templateId: rule.actionConfig?.templateId
              });
          } else if (rule.actionType === ActionType.PUSH_REVIEW) {
               // Push Review Logic
               const reviewLink = rule.actionConfig?.reviewLink || 'https://google.com/review';
               const content = rule.actionConfig?.content || `Thanks for visiting! Please review us here: ${reviewLink}`;

               // Default to SMS if not specified? Or check user preference?
               // For simplicity, default to SMS or WhatsApp if available.
               // Assuming SMS for now as fallback.
               await this.messagingEngine.sendMessage({
                   businessId: rule.businessId,
                   branchId: rule.branchId || triggerDto.branchId,
                   channel: Channel.SMS,
                   contactIds: [triggerDto.contactId],
                   content
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
