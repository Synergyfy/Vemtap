import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { ChatSettings } from './entities/chat-settings.entity';
import { FaqTrigger } from './entities/faq-trigger.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from './dto/automation-rule.dto';
import { UpdateChatSettingsDto } from './dto/chat-settings.dto';
import { CreateFaqTriggerDto, UpdateFaqTriggerDto } from './dto/faq-trigger.dto';
import { CreateMessageTemplateDto, UpdateMessageTemplateDto } from './dto/message-template.dto';

@Injectable()
export class MessagingAutomationsService {
  constructor(
    @InjectRepository(AutomationRule)
    private readonly automationRuleRepository: Repository<AutomationRule>,
    @InjectRepository(ChatSettings)
    private readonly chatSettingsRepository: Repository<ChatSettings>,
    @InjectRepository(FaqTrigger)
    private readonly faqTriggerRepository: Repository<FaqTrigger>,
    @InjectRepository(MessageTemplate)
    private readonly messageTemplateRepository: Repository<MessageTemplate>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  // --- Automation Rules ---

  async findAllRules(businessId: string, branchId?: string): Promise<AutomationRule[]> {
    const where: any = { businessId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.automationRuleRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async createRule(businessId: string, dto: CreateAutomationRuleDto): Promise<AutomationRule> {
    await this.validateAutomationLimit(businessId);
    
    const rule = this.automationRuleRepository.create({
      ...dto,
      businessId,
    });
    return this.automationRuleRepository.save(rule);
  }

  async updateRule(id: string, businessId: string, dto: UpdateAutomationRuleDto): Promise<AutomationRule> {
    const rule = await this.automationRuleRepository.findOne({ where: { id, businessId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    
    Object.assign(rule, dto);
    return this.automationRuleRepository.save(rule);
  }

  async deleteRule(id: string, businessId: string): Promise<void> {
    const rule = await this.automationRuleRepository.findOne({ where: { id, businessId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    await this.automationRuleRepository.remove(rule);
  }

  // --- Chat Settings ---

  async getChatSettings(branchId: string): Promise<ChatSettings> {
    let settings = await this.chatSettingsRepository.findOne({ where: { branchId } });
    if (!settings) {
      settings = this.chatSettingsRepository.create({ branchId });
      await this.chatSettingsRepository.save(settings);
    }
    
    // Get FAQs to match frontend expectation of automation object
    const faqs = await this.faqTriggerRepository.find({ where: { branchId } });
    return { ...settings, faqKeywords: faqs } as any;
  }

  async updateChatSettings(branchId: string, dto: UpdateChatSettingsDto): Promise<ChatSettings> {
    let settings = await this.chatSettingsRepository.findOne({ where: { branchId } });
    if (!settings) {
      settings = this.chatSettingsRepository.create({ branchId });
    }
    
    Object.assign(settings, dto);
    return this.chatSettingsRepository.save(settings);
  }

  // --- FAQ Triggers ---

  async createFaq(branchId: string, dto: CreateFaqTriggerDto): Promise<FaqTrigger> {
    const faq = this.faqTriggerRepository.create({ ...dto, branchId });
    return this.faqTriggerRepository.save(faq);
  }

  async updateFaq(id: string, branchId: string, dto: UpdateFaqTriggerDto): Promise<FaqTrigger> {
    const faq = await this.faqTriggerRepository.findOne({ where: { id, branchId } });
    if (!faq) throw new NotFoundException('FAQ trigger not found');
    
    Object.assign(faq, dto);
    return this.faqTriggerRepository.save(faq);
  }

  async deleteFaq(id: string, branchId: string): Promise<void> {
    const faq = await this.faqTriggerRepository.findOne({ where: { id, branchId } });
    if (!faq) throw new NotFoundException('FAQ trigger not found');
    await this.faqTriggerRepository.remove(faq);
  }

  // --- Templates ---

  async findAllTemplates(businessId: string, branchId?: string): Promise<MessageTemplate[]> {
    const where: any = { businessId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.messageTemplateRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async createTemplate(businessId: string, dto: CreateMessageTemplateDto): Promise<MessageTemplate> {
    const template = this.messageTemplateRepository.create({ ...dto, businessId });
    return this.messageTemplateRepository.save(template);
  }

  async updateTemplate(id: string, businessId: string, dto: UpdateMessageTemplateDto): Promise<MessageTemplate> {
    const template = await this.messageTemplateRepository.findOne({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');
    
    Object.assign(template, dto);
    return this.messageTemplateRepository.save(template);
  }

  async deleteTemplate(id: string, businessId: string): Promise<void> {
    const template = await this.messageTemplateRepository.findOne({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');
    await this.messageTemplateRepository.remove(template);
  }

  // --- Limit Validation ---

  /**
   * Validates if the business can create a new automation rule based on their subscription plan.
   */
  async validateAutomationLimit(businessId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { businessId: businessId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription found for this business');
    }

    const plan = subscription.plan;

    if (!plan) {
      throw new ForbiddenException('No active subscription plan found');
    }

    if (!plan.automationsEnabled) {
      throw new ForbiddenException('Automations are not enabled for your current plan');
    }

    // If maxAutomations is null or -1, it means unlimited
    if (plan.maxAutomations !== null && plan.maxAutomations !== -1) {
      // Count all automation rules for this business across all branches
      const currentRuleCount = await this.automationRuleRepository.count({
        where: { businessId: businessId },
      });

      if (currentRuleCount >= plan.maxAutomations) {
        throw new ForbiddenException(
          `You have reached the maximum allowed automations (${plan.maxAutomations}) for your plan. Please upgrade your plan to create more.`,
        );
      }
    }
  }
}
