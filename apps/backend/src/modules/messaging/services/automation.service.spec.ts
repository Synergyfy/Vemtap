import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from './automation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  AutomationRule,
  AutomationTriggerType,
} from '../entities/automation-rule.entity';
import { AutomationLog } from '../entities/automation-log.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { Channel } from '../enums/channel.enum';

describe('AutomationService', () => {
  let service: AutomationService;
  let ruleRepoMock: any;
  let logRepoMock: any;
  let contactRepoMock: any;
  let messagingEngineMock: any;

  beforeEach(async () => {
    ruleRepoMock = {
      find: jest.fn(),
    };
    logRepoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn(),
    };
    contactRepoMock = {
      findOne: jest.fn(),
    };
    messagingEngineMock = {
      sendMessage: jest.fn().mockResolvedValue({ messageIds: ['msg-123'] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        { provide: getRepositoryToken(AutomationRule), useValue: ruleRepoMock },
        { provide: getRepositoryToken(AutomationLog), useValue: logRepoMock },
        { provide: getRepositoryToken(Contact), useValue: contactRepoMock },
        { provide: MessagingEngineService, useValue: messagingEngineMock },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
  });

  describe('handleEvent', () => {
    const branchId = 'branch-1';
    const payload = { contactId: 'contact-1', surveyId: 'survey-A' };

    it('should do nothing if no rules match', async () => {
      ruleRepoMock.find.mockResolvedValue([]);
      await service.handleEvent(
        AutomationTriggerType.SURVEY_COMPLETED,
        branchId,
        payload,
      );
      expect(messagingEngineMock.sendMessage).not.toHaveBeenCalled();
    });

    it('should do nothing if contact not found', async () => {
      ruleRepoMock.find.mockResolvedValue([{ id: 'rule-1' }]);
      contactRepoMock.findOne.mockResolvedValue(null);

      await service.handleEvent(
        AutomationTriggerType.SURVEY_COMPLETED,
        branchId,
        payload,
      );
      expect(messagingEngineMock.sendMessage).not.toHaveBeenCalled();
    });

    it('should execute rule if conditions match', async () => {
      const rule = {
        id: 'rule-1',
        businessId: 'biz-1',
        branchId,
        triggerType: AutomationTriggerType.SURVEY_COMPLETED,
        actionChannel: Channel.SMS,
        actionTemplateId: 'template-1',
        conditions: { surveyId: 'survey-A' },
        delaySeconds: 0,
      };

      ruleRepoMock.find.mockResolvedValue([rule]);
      contactRepoMock.findOne.mockResolvedValue({ id: 'contact-1' });

      await service.handleEvent(
        AutomationTriggerType.SURVEY_COMPLETED,
        branchId,
        payload,
      );

      expect(messagingEngineMock.sendMessage).toHaveBeenCalledWith({
        businessId: 'biz-1',
        branchId,
        channel: Channel.SMS,
        templateId: 'template-1',
        contactIds: ['contact-1'],
      });
      expect(logRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'executed',
          messageId: 'msg-123',
        }),
      );
    });

    it('should skip rule if conditions do not match', async () => {
      const rule = {
        id: 'rule-1',
        conditions: { surveyId: 'survey-B' }, // Mismatch
      };

      ruleRepoMock.find.mockResolvedValue([rule]);
      contactRepoMock.findOne.mockResolvedValue({ id: 'contact-1' });

      await service.handleEvent(
        AutomationTriggerType.SURVEY_COMPLETED,
        branchId,
        payload,
      );

      expect(messagingEngineMock.sendMessage).not.toHaveBeenCalled();
    });
  });
});
