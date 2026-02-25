import { Test, TestingModule } from '@nestjs/testing';
import { MessagingEngineService } from './messaging-engine.service';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { CreditService } from './credit.service';
import { TemplateService } from './template.service';
import { CampaignService } from './campaign.service';
import { SettingsService } from '../../settings/settings.service';
import { ProviderRouterService } from './provider-router.service';
import { DataSource } from 'typeorm';

import { Contact } from '../../contacts/entities/contact.entity';
import { Message } from '../entities/message.entity';
import { MessageLog } from '../entities/message-log.entity';
import { ConversationThread } from '../entities/conversation-thread.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';

describe('MessagingEngineService', () => {
  let service: MessagingEngineService;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((d) => d),
    save: jest
      .fn()
      .mockImplementation((e) => Promise.resolve({ id: '1', ...e })),
    findBy: jest.fn(),
    update: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockCreditService = {
    deduct: jest.fn(),
    deductChannelCredit: jest.fn(),
  };

  const mockCampaignService = {
    createCampaign: jest.fn().mockResolvedValue({ id: 'c1' }),
  };

  const mockSettingsService = {
    getGlobalSettings: jest.fn().mockResolvedValue({
      messagingCostSms: 0.05,
      messagingCostWhatsapp: 0.08,
      messagingCostEmail: 0.01,
    }),
  };

  const mockProviderRouter = {
    sendMessage: jest
      .fn()
      .mockResolvedValue({ messageId: 'msg-1', status: 'sent' }),
    estimateCost: jest.fn().mockReturnValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingEngineService,
        { provide: getRepositoryToken(Contact), useValue: mockRepo },
        { provide: getRepositoryToken(Message), useValue: mockRepo },
        { provide: getRepositoryToken(MessageLog), useValue: mockRepo },
        { provide: getRepositoryToken(ConversationThread), useValue: mockRepo },
        { provide: getRepositoryToken(Business), useValue: mockRepo },
        { provide: getRepositoryToken(Branch), useValue: mockRepo },
        { provide: getQueueToken('messaging-batch-send'), useValue: mockQueue },
        {
          provide: ComplianceService,
          useValue: {
            validateConsentBeforeSend: jest.fn(),
            handleOptOut: jest.fn(),
          },
        },
        { provide: CreditService, useValue: mockCreditService },
        {
          provide: TemplateService,
          useValue: { getTemplate: jest.fn(), render: jest.fn() },
        },
        { provide: CampaignService, useValue: mockCampaignService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ProviderRouterService, useValue: mockProviderRouter },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<MessagingEngineService>(MessagingEngineService);
  });

  describe('sendMessage', () => {
    it('should throw an error if business is not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.sendMessage({
          businessId: 'b1',
          branchId: 'br1',
          channel: Channel.SMS,
          content: 'test',
        }),
      ).rejects.toThrow('Business not found');
    });

    it('should deduct credits and enqueue a batch job when targeting multiple contacts', async () => {
      mockRepo.findOne.mockResolvedValueOnce({
        id: 'b1',
        name: 'TestBusiness',
      });
      // Mock resolveAudience
      mockRepo.find.mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }]);
      // Mock branchRepo.findOne
      mockRepo.findOne.mockResolvedValueOnce({ id: 'branch1' });

      const result = await service.sendMessage({
        businessId: 'b1',
        branchId: 'branch1',
        channel: Channel.SMS,
        content: 'msg',
      });

      expect(mockCreditService.deductChannelCredit).toHaveBeenCalled();
      expect(mockCampaignService.createCampaign).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalled();
      expect(result.campaignId).toBe('c1');
    });
  });
});
