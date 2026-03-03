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

describe('AutomationService', () => {
  let service: AutomationService;
  let ruleRepo: Repository<AutomationRule>;
  let logRepo: Repository<AutomationLog>;
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
          },
        },
        {
          provide: getRepositoryToken(AutomationLog),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
    ruleRepo = module.get(getRepositoryToken(AutomationRule));
    logRepo = module.get(getRepositoryToken(AutomationLog));
    messagingEngine = module.get(MessagingEngineService);
    queue = module.get(getQueueToken('messaging-automation'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trigger', () => {
    it('should execute immediate rule', async () => {
      const rule = {
        id: '1',
        triggerType: TriggerType.FIRST_TAG,
        delaySeconds: 0,
        actionType: ActionType.SEND_SMS,
        businessId: 'biz1',
        branchId: 'br1',
        isActive: true,
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'find').mockResolvedValue([rule]);
      jest.spyOn(ruleRepo, 'findOne').mockResolvedValue(rule);
      const executeSpy = jest.spyOn(service, 'executeRule');

      await service.trigger(TriggerType.FIRST_TAG, {
        businessId: 'biz1',
        branchId: 'br1',
        contactId: 'c1',
      });

      expect(executeSpy).toHaveBeenCalledWith('1', expect.anything());
    });

    it('should queue delayed rule', async () => {
      const rule = {
        id: '1',
        triggerType: TriggerType.FIRST_TAG,
        delaySeconds: 3600,
        actionType: ActionType.SEND_SMS,
        businessId: 'biz1',
        branchId: 'br1',
        isActive: true,
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'find').mockResolvedValue([rule]);

      await service.trigger(TriggerType.FIRST_TAG, {
        businessId: 'biz1',
        branchId: 'br1',
        contactId: 'c1',
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
        businessId: 'biz1',
        branchId: 'br1',
        isActive: true,
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'findOne').mockResolvedValue(rule);

      await service.executeRule('1', {
        businessId: 'biz1',
        branchId: 'br1',
        contactId: 'c1',
      });

      expect(messagingEngine.sendMessage).toHaveBeenCalled();
      expect(logRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });
  });

  describe('configureAutomation', () => {
    it('should update content and delayDays correctly', async () => {
      const rule = {
        id: '1',
        actionConfig: {},
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'findOne').mockResolvedValue(rule);
      jest
        .spyOn(ruleRepo, 'save')
        .mockImplementation(async (r) => r as AutomationRule);

      const result = await service.configureAutomation('1', {
        content: 'Hello {{visitor_name}}',
        delayDays: 2,
        loyaltyPoints: 10,
      });

      expect(result.actionConfig.content).toBe('Hello {{visitor_name}}');
      expect(result.actionConfig.loyaltyPoints).toBe(10);
      expect(result.delaySeconds).toBe(2 * 24 * 60 * 60);
    });

    it('should throw error for invalid variables in content', async () => {
      const rule = {
        id: '1',
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'findOne').mockResolvedValue(rule);

      await expect(
        service.configureAutomation('1', {
          content: 'Hello {{invalid_var}}',
        }),
      ).rejects.toThrow('Invalid variable found: {{invalid_var}}');
    });

    it('should allow valid variables in content', async () => {
      const rule = {
        id: '1',
      } as any as AutomationRule;

      jest.spyOn(ruleRepo, 'findOne').mockResolvedValue(rule);
      jest
        .spyOn(ruleRepo, 'save')
        .mockImplementation(async (r) => r as AutomationRule);

      await expect(
        service.configureAutomation('1', {
          content:
            'Hi {{visitor_name}}, welcome to {{business_name}} at {{branch_name}}. You earned {{loyalty_points}} points!',
        }),
      ).resolves.toBeDefined();
    });
  });
});
