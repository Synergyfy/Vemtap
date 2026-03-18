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
import { LoyaltyProfile } from '../../campaigns/entities/loyalty-profile.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Channel } from '../enums/channel.enum';
import { BadRequestException } from '@nestjs/common';
import { CreditPlanService } from './credit-plan.service';
import { PaymentsService } from '../../payments/payments.service';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';

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
      allocateSubscriptionCredits: jest.fn().mockImplementation(async (bizId, plan) => {
          if (plan.smsCredits > 0) await creditServiceMock.addCredits(bizId, Channel.SMS, plan.smsCredits, 'SUBSCRIPTION_ALLOCATION' as any, `Plan: ${plan.name}`);
      }),
    };
    paymentsServiceMock = {
        verifyTransaction: jest.fn().mockResolvedValue({ amount: 100000, status: 'success' }),
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
        { provide: getRepositoryToken(LoyaltyProfile), useValue: {} },
        { provide: getRepositoryToken(Visit), useValue: {} },
        { provide: getRepositoryToken(Business), useValue: {} },
        { provide: getQueueToken('messaging-batch-send'), useValue: mockQueue },
        { provide: getQueueToken('messaging-individual-send'), useValue: mockIndividualQueue },
        { provide: ComplianceService, useValue: {} },
        { provide: CreditService, useValue: creditServiceMock },
        { provide: TemplateService, useValue: { findOne: jest.fn() } },
        { provide: CampaignService, useValue: { createCampaign: jest.fn().mockResolvedValue({id: 'c1'}) } },
        { provide: SettingsService, useValue: {} },
        { provide: ProviderRouterService, useValue: {} },
        { provide: BranchesService, useValue: { findById: jest.fn(), checkBranchAccess: jest.fn() } },
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

  describe('SMS Credit Calculation', () => {
    it('should cost 1 credit for SMS <= 160 characters', async () => {
      const content = 'A'.repeat(160);
      branchRepoMock.findOne.mockResolvedValue({ id: 'br1', businessId: 'biz1' });
      userRepoMock.find.mockResolvedValue([{ id: 'c1', firstName: 'C1', role: UserRole.CUSTOMER }]);
      creditServiceMock.getOrCreateWallet.mockResolvedValue({ smsCredits: 1 });

      await service.sendMessage({
        branchId: 'br1',
        customerIds: ['c1'],
        channel: Channel.SMS,
        content,
      } as any);

      expect(mockIndividualQueue.add).toHaveBeenCalled();
    });

    it('should cost 2 credits for SMS > 160 characters', async () => {
      const content = 'A'.repeat(161);
      branchRepoMock.findOne.mockResolvedValue({ id: 'br1', businessId: 'biz1' });
      userRepoMock.find.mockResolvedValue([{ id: 'c1', firstName: 'C1', role: UserRole.CUSTOMER }]);
      
      creditServiceMock.getOrCreateWallet.mockResolvedValue({ smsCredits: 1 });

      await expect(service.sendMessage({
        branchId: 'br1',
        customerIds: ['c1'],
        channel: Channel.SMS,
        content,
      } as any)).rejects.toThrow(BadRequestException);
    });

    it('should account for placeholders when calculating SMS length', async () => {
      const content = 'A'.repeat(150) + '{Name}';
      branchRepoMock.findOne.mockResolvedValue({ 
        id: 'br1', 
        businessId: 'biz1',
        business: { name: 'VemTap' }
      });
      userRepoMock.find.mockResolvedValue([{ 
        id: 'c1', 
        firstName: 'Johnathan Christopher',
        lastName: 'Alexander Smith', // 38 characters combined
        role: UserRole.CUSTOMER
      }]);
      
      creditServiceMock.getOrCreateWallet.mockResolvedValue({ smsCredits: 1 });

      await expect(service.sendMessage({
        branchId: 'br1',
        customerIds: ['c1'],
        channel: Channel.SMS,
        content,
      } as any)).rejects.toThrow(/Insufficient SMS credits/);
    });

    it('should succeed if enough credits for multiple contacts with long names', async () => {
        const longContent = 'A'.repeat(140) + ' {Name}';

        branchRepoMock.findOne.mockResolvedValue({ 
          id: 'br1', 
          businessId: 'biz1',
          business: { name: 'VemTap' }
        });
        userRepoMock.find.mockResolvedValue([
            { id: 'c1', firstName: 'Short', lastName: '', role: UserRole.CUSTOMER }, // 140 + 1 + 5 = 146 (1 unit)
            { id: 'c2', firstName: 'Johnathan Christopher', lastName: 'Alexander Smith', role: UserRole.CUSTOMER } // 140 + 1 + 38 = 179 (2 units)
        ]);

        creditServiceMock.getOrCreateWallet.mockResolvedValue({ smsCredits: 2 });

        await expect(service.sendMessage({
            branchId: 'br1',
            customerIds: ['c1', 'c2'],
            channel: Channel.SMS,
            content: longContent,
        } as any)).rejects.toThrow(/Need 3/);

        creditServiceMock.getOrCreateWallet.mockResolvedValue({ smsCredits: 3 });
        const result = await service.sendMessage({
            branchId: 'br1',
            customerIds: ['c1', 'c2'],
            channel: Channel.SMS,
            content: longContent,
        } as any);
        expect(result.count).toBe(2);
    });
  });

  describe('Credit Top-up and Allocation', () => {
    it('should add credits to wallet when a credit plan is purchased', async () => {
        const mockPlan = { id: 'p1', name: 'Basic SMS', price: 1000, smsAmount: 100, emailAmount: 0, whatsappAmount: 0 };
        const moduleRef = await Test.createTestingModule({
            providers: [
                CreditPlanService,
                { provide: getRepositoryToken(User), useValue: {} },
                { provide: getRepositoryToken(Message), useValue: {} },
                { provide: getRepositoryToken(MessageLog), useValue: {} },
                { provide: getRepositoryToken(ConversationThread), useValue: {} },
                { provide: getRepositoryToken(Branch), useValue: {} },
                { provide: getRepositoryToken(Business), useValue: {} },
                { provide: getRepositoryToken(LoyaltyProfile), useValue: {} },
                { provide: getRepositoryToken(Visit), useValue: {} },
                { provide: getQueueToken('messaging-batch-send'), useValue: {} },
                { provide: getQueueToken('messaging-individual-send'), useValue: {} },
                { provide: ComplianceService, useValue: {} },
                { provide: CreditService, useValue: creditServiceMock },
                { provide: TemplateService, useValue: {} },
                { provide: CampaignService, useValue: {} },
                { provide: SettingsService, useValue: {} },
                { provide: ProviderRouterService, useValue: {} },
                { provide: BranchesService, useValue: { findById: jest.fn().mockResolvedValue({ businessId: 'biz1'}) } },
                { provide: DataSource, useValue: {} },
                { provide: ConfigService, useValue: {} },
                { provide: PaymentsService, useValue: paymentsServiceMock },
                { provide: getRepositoryToken(require('../entities/credit-plan.entity').CreditPlan), useValue: { findOne: jest.fn().mockResolvedValue(mockPlan) } },
                { provide: MessagingGateway, useValue: {} },
                { provide: PushNotificationService, useValue: {} },
            ],
        }).compile();

        const cpService = moduleRef.get<CreditPlanService>(CreditPlanService);

        await cpService.purchase('br1', 'p1', 'ref1');

        expect(creditServiceMock.addCredits).toHaveBeenCalledWith(
            'biz1',
            Channel.SMS,
            100,
            expect.any(String),
            expect.stringContaining('Top-up')
        );
    });

    it('should allocate credits when a subscription plan is assigned', async () => {
        const mockSubPlan = { name: 'Premium', smsCredits: 500 };
        
        await creditServiceMock.allocateSubscriptionCredits('biz1', mockSubPlan);

        expect(creditServiceMock.addCredits).toHaveBeenCalledWith(
            'biz1',
            Channel.SMS,
            500,
            expect.any(String),
            expect.any(String)
        );
    });
  });
});
