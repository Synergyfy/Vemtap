import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { AutomationService } from './automation.service';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationLog } from '../entities/automation-log.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { TriggerType, ActionType } from '../enums/automation.enum';
import { BranchesService } from '../../branches/branches.service';
import {
  Subscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/subscription.entity';
import { ForbiddenException } from '@nestjs/common';

describe('AutomationService', () => {
  let service: AutomationService;
  let ruleRepo: Repository<AutomationRule>;
  let logRepo: Repository<AutomationLog>;
  let subscriptionRepo: Repository<Subscription>;
  let messagingEngine: MessagingEngineService;
  let queue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: getRepositoryToken(AutomationRule),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AutomationLog),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: MessagingEngineService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
        {
          provide: getQueueToken('messaging-automation'),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: BranchesService,
          useValue: {
            getBusinessId: jest.fn().mockResolvedValue('bus-1'),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
    ruleRepo = module.get(getRepositoryToken(AutomationRule));
    logRepo = module.get(getRepositoryToken(AutomationLog));
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    messagingEngine = module.get(MessagingEngineService);
    queue = module.get(getQueueToken('messaging-automation'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAutomationLimit', () => {
    const businessId = 'bus-1';

    it('should throw if no active subscription', async () => {
      jest.spyOn(subscriptionRepo, 'findOne').mockResolvedValue(null);
      await expect(service.validateAutomationLimit(businessId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw if automations disabled in plan', async () => {
      jest.spyOn(subscriptionRepo, 'findOne').mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: false },
      } as any);
      await expect(service.validateAutomationLimit(businessId)).rejects.toThrow(
        'Automations are not enabled',
      );
    });

    it('should throw if limit reached', async () => {
      jest.spyOn(subscriptionRepo, 'findOne').mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: true, maxAutomations: 2 },
      } as any);
      jest.spyOn(ruleRepo, 'count').mockResolvedValue(2);
      await expect(service.validateAutomationLimit(businessId)).rejects.toThrow(
        'maximum allowed automations',
      );
    });

    it('should pass if limit not reached', async () => {
      jest.spyOn(subscriptionRepo, 'findOne').mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: true, maxAutomations: 5 },
      } as any);
      jest.spyOn(ruleRepo, 'count').mockResolvedValue(2);
      await expect(
        service.validateAutomationLimit(businessId),
      ).resolves.not.toThrow();
    });

    it('should pass if unlimited (-1)', async () => {
      jest.spyOn(subscriptionRepo, 'findOne').mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { automationsEnabled: true, maxAutomations: -1 },
      } as any);
      await expect(
        service.validateAutomationLimit(businessId),
      ).resolves.not.toThrow();
    });
  });

  describe('trigger', () => {
    it('should execute immediate rule', async () => {
      const rule = {
        id: '1',
        triggerType: TriggerType.FIRST_MESSAGE,
        delaySeconds: 0,
        actionType: ActionType.SEND_SMS,
        branchId: 'br1',
        isActive: true,
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'find').mockResolvedValue([rule]);
      jest.spyOn(ruleRepo, 'findOne').mockResolvedValue(rule);
      const executeSpy = jest.spyOn(service, 'executeRule');

      await service.trigger(TriggerType.FIRST_MESSAGE, {
        branchId: 'br1',
        customerId: 'c1',
      });

      expect(executeSpy).toHaveBeenCalledWith('1', expect.anything());
    });

    it('should queue delayed rule', async () => {
      const rule = {
        id: '1',
        triggerType: TriggerType.FIRST_MESSAGE,
        delaySeconds: 3600,
        actionType: ActionType.SEND_SMS,
        branchId: 'br1',
        isActive: true,
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'find').mockResolvedValue([rule]);

      await service.trigger(TriggerType.FIRST_MESSAGE, {
        branchId: 'br1',
        customerId: 'c1',
      });

      expect(queue.add).toHaveBeenCalledWith(
        'execute-rule',
        expect.objectContaining({ ruleId: '1' }),
        expect.objectContaining({ delay: 3600000 }),
      );
    });
  });

  describe('executeRule', () => {
    it('should send message and log success', async () => {
      const rule = {
        id: '1',
        actionType: ActionType.SEND_SMS,
        actionConfig: { content: 'Hello' },
        branchId: 'br1',
        isActive: true,
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'findOne').mockResolvedValue(rule);

      await service.executeRule('1', {
        branchId: 'br1',
        customerId: 'c1',
      });

      expect(messagingEngine.sendMessage).toHaveBeenCalled();
      expect(logRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });
  });
});
