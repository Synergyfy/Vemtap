import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AutomationRule,
  AutomationTriggerType,
} from '../entities/automation-rule.entity';
import { AutomationLog } from '../entities/automation-log.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { Contact } from '../../contacts/entities/contact.entity';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepo: Repository<AutomationRule>,
    @InjectRepository(AutomationLog)
    private readonly logRepo: Repository<AutomationLog>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    private readonly messagingEngine: MessagingEngineService,
  ) {}

  async handleEvent(
    triggerType: AutomationTriggerType,
    branchId: string,
    payload: any,
  ): Promise<void> {
    this.logger.log(
      `Processing automation trigger: ${triggerType} for branch ${branchId}`,
    );

    // 1. Find active rules for this trigger and branch (or global business rules if applicable, but we focus on branch)
    const rules = await this.ruleRepo.find({
      where: {
        branchId,
        triggerType,
        isActive: true,
      },
      relations: ['template'],
    });

    if (!rules.length) return;

    // 2. Resolve Contact from payload
    // Payload usually has { contactId } or { phone, email } depending on event
    let contact: Contact | null = null;
    if (payload.contactId) {
      contact = await this.contactRepo.findOne({
        where: { id: payload.contactId },
      });
    } else if (payload.phone) {
      // Find by phone and branch's business? Contact is business-level.
      // Need businessId from branch context ideally.
      // But rules have businessId. Let's use the first rule's businessId as they should be consistent for the branch.
      const businessId = rules[0].businessId;
      contact = await this.contactRepo.findOne({
        where: { businessId, phone: payload.phone },
      });
    }

    if (!contact) {
      this.logger.warn(
        `No contact found for automation payload: ${JSON.stringify(payload)}`,
      );
      return;
    }

    // 3. Evaluate and Execute each rule
    for (const rule of rules) {
      try {
        if (!this.evaluateConditions(rule, payload)) continue;

        if (rule.delaySeconds > 0) {
          // TODO: Implement delayed job queue (Future Scope: Phase 2)
          this.logger.log(
            `Skipping delayed rule ${rule.id} (Delay not implemented yet)`,
          );
          continue;
        }

        // Execute Immediate
        await this.executeRule(rule, contact, payload);
      } catch (err) {
        this.logger.error(`Failed to execute rule ${rule.id}: ${err.message}`);
        await this.logExecution(
          rule,
          contact,
          payload,
          'failed',
          undefined,
          err.message,
        );
      }
    }
  }

  private evaluateConditions(rule: AutomationRule, payload: any): boolean {
    if (!rule.conditions) return true;

    // Simple key-value match for now
    // e.g. conditions: { surveyId: '123' } -> payload.surveyId === '123'
    for (const key in rule.conditions) {
      if (payload[key] !== rule.conditions[key]) {
        return false;
      }
    }
    return true;
  }

  private async executeRule(
    rule: AutomationRule,
    contact: Contact,
    payload: any,
  ) {
    if (!rule.actionTemplateId) {
      throw new Error('No template configured for rule');
    }

    const dto: SendMessageDto = {
      businessId: rule.businessId,
      branchId: rule.branchId,
      channel: rule.actionChannel,
      templateId: rule.actionTemplateId,
      contactIds: [contact.id],
    };

    const result = await this.messagingEngine.sendMessage(dto);
    const messageId = result.messageIds?.[0];

    await this.logExecution(rule, contact, payload, 'executed', messageId);
  }

  private async logExecution(
    rule: AutomationRule,
    contact: Contact,
    payload: any,
    status: string,
    messageId?: string,
    error?: string,
  ) {
    const log = this.logRepo.create({
      businessId: rule.businessId,
      branchId: rule.branchId,
      ruleId: rule.id,
      contactId: contact.id,
      triggerPayload: payload,
      status,
      messageId,
      errorReason: error,
    });
    await this.logRepo.save(log);
  }
}
