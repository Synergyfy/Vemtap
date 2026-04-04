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
import { ConfigService } from '@nestjs/config';

import { User, UserRole } from '../../users/entities/user.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Message } from '../entities/message.entity';
import { MessageLog } from '../entities/message-log.entity';
import { ConversationThread } from '../entities/conversation-thread.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { LoyaltyService } from '../../loyalty/loyalty.service';

describe('MessagingEngineService', () => {
  let service: MessagingEngineService;
  let branchRepoMock: any;
  let userRepoMock: any;
  let visitRepoMock: any;
  let messageRepoMock: any;
  let loyaltyServiceMock: any;

  const mockQueue = {
    add: jest.fn(),
  };

  const mockIndividualQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    addBulk: jest.fn().mockResolvedValue([{ id: 'job-1' }]),
  };

  const mockCreditService = {
    getOrCreateWallet: jest.fn().mockResolvedValue({
      smsCredits: 1000,
      emailCredits: 1000,
      whatsappCredits: 1000,
    }),
    deductCredits: jest.fn(),
  };

  const mockCampaignService = {
    createCampaign: jest.fn().mockResolvedValue({ id: 'campaign-1' }),
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

  const mockGateway = {
    emitMessage: jest.fn(),
  };

  const mockPush = {
    sendNotification: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    branchRepoMock = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };
    userRepoMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
    };
    visitRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };
    messageRepoMock = {
      create: jest.fn().mockImplementation((d) => d),
      save: jest
        .fn()
        .mockImplementation((e) =>
          Promise.resolve(
            Array.isArray(e) ? [{ id: '1', ...e[0] }] : { id: '1', ...e },
          ),
        ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };
    loyaltyServiceMock = {
      getBusinessPoints: jest.fn().mockResolvedValue(500),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingEngineService,
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(Visit), useValue: visitRepoMock },
        { provide: getRepositoryToken(Message), useValue: messageRepoMock },
        { provide: getRepositoryToken(MessageLog), useValue: messageRepoMock },
        {
          provide: getRepositoryToken(ConversationThread),
          useValue: messageRepoMock,
        },
        { provide: getRepositoryToken(Business), useValue: messageRepoMock },
        { provide: getRepositoryToken(Branch), useValue: branchRepoMock },
        { provide: LoyaltyService, useValue: loyaltyServiceMock },
        { provide: getQueueToken('messaging-batch-send'), useValue: mockQueue },
        {
          provide: getQueueToken('messaging-individual-send'),
          useValue: mockIndividualQueue,
        },
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
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MessagingGateway, useValue: mockGateway },
        { provide: PushNotificationService, useValue: mockPush },
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

    it('should enqueue individual jobs when targeting multiple customers (<= 50)', async () => {
      branchRepoMock.findOne.mockResolvedValueOnce({
        id: 'br1',
        businessId: 'biz1',
      });
      userRepoMock.find.mockResolvedValueOnce([{ id: 'u1' }, { id: 'u2' }]);

      const result = await service.sendMessage({
        branchId: 'br1',
        customerIds: ['u1', 'u2'],
        channel: Channel.SMS,
        content: 'msg',
      });

      expect(mockCampaignService.createCampaign).toHaveBeenCalled();
      expect(mockIndividualQueue.addBulk).toHaveBeenCalledTimes(1);
      expect(mockIndividualQueue.addBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'send-individual',
            data: expect.objectContaining({ customerId: 'u1' }),
          }),
          expect.objectContaining({
            name: 'send-individual',
            data: expect.objectContaining({ customerId: 'u2' }),
          }),
        ]),
      );
      expect(result.status).toBe('QUEUED');
      expect(result.count).toBe(2);
    });

    it('should throw BadRequestException if no customers found', async () => {
      branchRepoMock.findOne.mockResolvedValueOnce({
        id: 'br1',
        businessId: 'biz1',
      });
      await expect(
        service.sendMessage({
          branchId: 'br1',
          customerIds: [],
          channel: Channel.SMS,
          content: 'test',
        }),
      ).rejects.toThrow('No customers found for selected audience');
    });
  });

  describe('processSingleSend', () => {
    it('should resolve placeholders and send message', async () => {
      branchRepoMock.findOneBy.mockResolvedValueOnce({
        id: 'br1',
        name: 'VemTap Branch',
        businessId: 'biz1',
        business: { name: 'VemTap Global' },
        website: 'https://vemtap.com',
        reviewUrl: 'https://google.com/review',
      });
      userRepoMock.findOneBy.mockResolvedValue({
        id: 'u1',
        phone: '123',
        email: 'tobi@example.com',
        firstName: 'Tobi',
        lastName: 'Adeyemi',
      });
      messageRepoMock.findOneBy.mockResolvedValue({
        id: 'msg-1',
        content: 'Hello Tobi Adeyemi...',
        branchId: 'br1',
        customerId: 'u1',
      });

      await service.processSingleSend(
        'br1',
        'u1',
        'Hello {FirstName} {LastName}, welcome to {BusinessName}. Your email is {Email}. Link: {Link}. Points: {Points}',
        Channel.SMS,
        'VEMTAP',
      );

      expect(messageRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content:
            'Hello Tobi Adeyemi, welcome to VemTap Global. Your email is tobi@example.com. Link: https://vemtap.com. Points: 500',
        }),
      );
      expect(mockIndividualQueue.add).toHaveBeenCalled();
    });
  });
});
