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
import { Message } from '../entities/message.entity';
import { MessageLog } from '../entities/message-log.entity';
import { ConversationThread } from '../entities/conversation-thread.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Channel } from '../enums/channel.enum';
import { BadRequestException } from '@nestjs/common';
import { CreditPlanService } from './credit-plan.service';
import { PaymentsService } from '../../payments/payments.service';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { LoyaltyService } from '../../loyalty/loyalty.service';

describe('MessagingEngineService Credit Logic', () => {
  let service: MessagingEngineService;
  let branchRepoMock: any;
  let userRepoMock: any;
  let creditServiceMock: any;
  let creditPlanService: CreditPlanService;
  let paymentsServiceMock: any;

  const mockIndividualQueue = {
    add: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    branchRepoMock = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findById: jest.fn(),
    };
    userRepoMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
    };
    creditServiceMock = {
      getOrCreateWallet: jest.fn(),
      deductCredits: jest.fn(),
      addCredits: jest.fn(),
      allocateSubscriptionCredits: jest
        .fn()
        .mockImplementation(async (bizId, plan) => {
          if (plan.smsCredits > 0)
            await creditServiceMock.addCredits(
              bizId,
              Channel.SMS,
              plan.smsCredits,
              'SUBSCRIPTION_ALLOCATION' as any,
              `Plan: ${plan.name}`,
            );
        }),
    };
    paymentsServiceMock = {
      verifyTransaction: jest
        .fn()
        .mockResolvedValue({ amount: 100000, status: 'success' }),
      recordPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingEngineService,
        CreditPlanService,
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(Message), useValue: {} },
        { provide: getRepositoryToken(MessageLog), useValue: {} },
        { provide: getRepositoryToken(ConversationThread), useValue: {} },
        { provide: getRepositoryToken(Branch), useValue: branchRepoMock },
        { provide: LoyaltyService, useValue: {} },
        { provide: getRepositoryToken(Visit), useValue: {} },
        { provide: getRepositoryToken(Business), useValue: {} },
        { provide: getQueueToken('messaging-batch-send'), useValue: mockQueue },
        {
          provide: getQueueToken('messaging-individual-send'),
          useValue: mockIndividualQueue,
        },
        { provide: ComplianceService, useValue: {} },
        { provide: CreditService, useValue: creditServiceMock },
        { provide: TemplateService, useValue: { findOne: jest.fn() } },
        {
          provide: CampaignService,
          useValue: {
            createCampaign: jest.fn().mockResolvedValue({ id: 'c1' }),
          },
        },
        { provide: SettingsService, useValue: {} },
        { provide: ProviderRouterService, useValue: {} },
        {
          provide: BranchesService,
          useValue: { findById: jest.fn(), checkBranchAccess: jest.fn() },
        },
        { provide: DataSource, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PaymentsService, useValue: paymentsServiceMock },
        { provide: 'CreditPlanRepository', useValue: { findOne: jest.fn() } },
        { provide: MessagingGateway, useValue: {} },
        { provide: PushNotificationService, useValue: {} },
      ],
    }).compile();

    service = module.get<MessagingEngineService>(MessagingEngineService);
    creditPlanService = module.get<CreditPlanService>(CreditPlanService);
  });

  it('should throw BadRequestException if credits are insufficient', async () => {
    branchRepoMock.findOne.mockResolvedValueOnce({
      id: 'br1',
      businessId: 'biz1',
    });
    userRepoMock.find.mockResolvedValueOnce([{ id: 'u1' }]);
    creditServiceMock.getOrCreateWallet.mockResolvedValueOnce({
      smsCredits: 0,
    });

    await expect(
      service.sendMessage({
        branchId: 'br1',
        customerIds: ['u1'],
        channel: Channel.SMS,
        content: 'test',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
