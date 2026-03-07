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
import { BranchesService } from '../../branches/branches.service';
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
  let branchRepoMock: any;
  let contactRepoMock: any;
  let messageRepoMock: any;

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
    getSettings: jest.fn().mockResolvedValue({
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
    branchRepoMock = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };
    contactRepoMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
    };
    messageRepoMock = {
      create: jest.fn().mockImplementation((d) => d),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ id: '1', ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingEngineService,
        { provide: getRepositoryToken(Contact), useValue: contactRepoMock },
        { provide: getRepositoryToken(Message), useValue: messageRepoMock },
        { provide: getRepositoryToken(MessageLog), useValue: messageRepoMock },
        {
          provide: getRepositoryToken(ConversationThread),
          useValue: messageRepoMock,
        },
        { provide: getRepositoryToken(Business), useValue: messageRepoMock },
        { provide: getRepositoryToken(Branch), useValue: branchRepoMock },
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
          useValue: { findOne: jest.fn(), render: jest.fn() },
        },
        { provide: CampaignService, useValue: mockCampaignService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ProviderRouterService, useValue: mockProviderRouter },
        {
          provide: BranchesService,
          useValue: { checkBranchAccess: jest.fn() },
        },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<MessagingEngineService>(MessagingEngineService);
  });

  describe('sendMessage', () => {
    it('should throw an error if branch is not found', async () => {
      branchRepoMock.findOne.mockResolvedValueOnce(null);
      await expect(
        service.sendMessage({
          branchId: 'br1',
          channel: Channel.SMS,
          content: 'test',
        }),
      ).rejects.toThrow('Branch not found');
    });

    it('should enqueue a batch job when targeting multiple contacts', async () => {
      branchRepoMock.findOne.mockResolvedValueOnce({
        id: 'br1',
        businessId: 'biz1',
      });
      contactRepoMock.find.mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }]);
      contactRepoMock.findOneBy
        .mockResolvedValueOnce({ id: 'c1', phone: '123' })
        .mockResolvedValueOnce({ id: 'c2', phone: '456' });

      const result = await service.sendMessage({
        branchId: 'br1',
        contactIds: ['c1', 'c2'],
        channel: Channel.SMS,
        content: 'msg',
      });

      expect(mockCampaignService.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'br1',
        }),
      );
      // It sends individually if <= 50 contacts
      expect(messageRepoMock.save).toHaveBeenCalled();
      expect(result.messageIds).toHaveLength(2);
    });

    it('should throw BadRequestException if no contacts provided', async () => {
      branchRepoMock.findOne.mockResolvedValueOnce({
        id: 'br1',
        businessId: 'biz1',
      });
      await expect(
        service.sendMessage({
          branchId: 'br1',
          contactIds: [],
          channel: Channel.SMS,
          content: 'test',
        }),
      ).rejects.toThrow('No contacts provided');
    });
  });
});
