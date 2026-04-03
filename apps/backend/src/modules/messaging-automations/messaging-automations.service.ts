import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class MessagingAutomationsService {
  constructor(
    @InjectRepository(AutomationRule)
    private readonly automationRuleRepository: Repository<AutomationRule>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

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
