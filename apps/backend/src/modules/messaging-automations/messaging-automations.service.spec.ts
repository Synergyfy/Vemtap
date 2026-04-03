import { Test, TestingModule } from '@nestjs/testing';
import { MessagingAutomationsService } from './messaging-automations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { ForbiddenException } from '@nestjs/common';

describe('MessagingAutomationsService', () => {
  let service: MessagingAutomationsService;
  let automationRuleRepository: any;
  let subscriptionRepository: any;

  beforeEach(async () => {
    automationRuleRepository = {
      count: jest.fn(),
    };
    subscriptionRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingAutomationsService,
        {
          provide: getRepositoryToken(AutomationRule),
          useValue: automationRuleRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<MessagingAutomationsService>(MessagingAutomationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAutomationLimit', () => {
    const businessId = 'test-business-id';

    it('should throw ForbiddenException if no active subscription is found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.validateAutomationLimit(businessId)).rejects.toThrow(
        new ForbiddenException('No active subscription found for this business'),
      );
    });

    it('should throw ForbiddenException if automations are not enabled for the plan', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: false },
      });

      await expect(service.validateAutomationLimit(businessId)).rejects.toThrow(
        new ForbiddenException('Automations are not enabled for your current plan'),
      );
    });

    it('should allow creation if maxAutomations is unlimited (-1)', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: true, maxAutomations: -1 },
      });

      await expect(service.validateAutomationLimit(businessId)).resolves.not.toThrow();
      expect(automationRuleRepository.count).not.toHaveBeenCalled();
    });

    it('should allow creation if maxAutomations is unlimited (null)', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: true, maxAutomations: null },
      });

      await expect(service.validateAutomationLimit(businessId)).resolves.not.toThrow();
      expect(automationRuleRepository.count).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if limit is reached', async () => {
      const maxAutomations = 2;
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: true, maxAutomations },
      });
      automationRuleRepository.count.mockResolvedValue(2);

      await expect(service.validateAutomationLimit(businessId)).rejects.toThrow(
        new ForbiddenException(
          `You have reached the maximum allowed automations (${maxAutomations}) for your plan. Please upgrade your plan to create more.`,
        ),
      );
    });

    it('should allow creation if limit is not reached', async () => {
      const maxAutomations = 5;
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: true, maxAutomations },
      });
      automationRuleRepository.count.mockResolvedValue(2);

      await expect(service.validateAutomationLimit(businessId)).resolves.not.toThrow();
      expect(automationRuleRepository.count).toHaveBeenCalledWith({
        where: { businessId },
      });
    });
  });
});
