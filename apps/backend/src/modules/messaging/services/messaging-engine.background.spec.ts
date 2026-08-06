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

import { User } from '../../users/entities/user.entity';
import { Message } from '../entities/message.entity';
import { MessageLog } from '../entities/message-log.entity';
import { ConversationThread } from '../entities/conversation-thread.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Channel } from '../enums/channel.enum';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { LoyaltyService } from '../../loyalty/loyalty.service';

describe('MessagingEngineService (Background Processing)', () => {
  let service: MessagingEngineService;
  let mockBatchQueue: any;
  let mockIndividualQueue: any;
  let userRepoMock: any;
  let branchRepoMock: any;

  beforeEach(async () => {
    mockBatchQueue = { add: jest.fn() };
    mockIndividualQueue = { add: jest.fn(), addBulk: jest.fn() };

    branchRepoMock = {
      findOne: jest.fn().mockResolvedValue({
        id: 'br1',
        businessId: 'biz1',
        whatsappNumber: '+1234567890',
        business: { id: 'biz1', name: 'Biz' },
      }),
    };

    userRepoMock = {
      find: jest.fn().mockResolvedValue([
        { id: 'c1', firstName: 'C1' },
        { id: 'c2', firstName: 'C2' },
      ]),
      findOneBy: jest
        .fn()
        .mockImplementation(({ id }) =>
          Promise.resolve({ id, firstName: id.toUpperCase() }),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingEngineService,
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest
              .fn()
              .mockImplementation((e) => Promise.resolve({ id: 'm1', ...e })),
          },
        },
        { provide: getRepositoryToken(MessageLog), useValue: {} },
        {
          provide: getRepositoryToken(ConversationThread),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 't1', branchId: 'br1', customerId: 'c1' }),
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest
              .fn()
              .mockImplementation((e) => Promise.resolve({ id: 't1', ...e })),
          },
        },
        { provide: getRepositoryToken(Business), useValue: {} },
        { provide: getRepositoryToken(Branch), useValue: branchRepoMock },
        { provide: LoyaltyService, useValue: {} },
        { provide: getRepositoryToken(Visit), useValue: {} },
        {
          provide: getQueueToken('messaging-batch-send'),
          useValue: mockBatchQueue,
        },
        {
          provide: getQueueToken('messaging-individual-send'),
          useValue: mockIndividualQueue,
        },
        { provide: ComplianceService, useValue: {} },
        {
          provide: CreditService,
          useValue: {
            getOrCreateWallet: jest.fn().mockResolvedValue({
              smsCredits: 1000,
              emailCredits: 1000,
              whatsappCredits: 1000,
            }),
            deductCredits: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: TemplateService, useValue: { findOne: jest.fn() } },
        {
          provide: CampaignService,
          useValue: {
            createCampaign: jest.fn().mockResolvedValue({ id: 'camp1' }),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getSettings: jest
              .fn()
              .mockResolvedValue({ whatsappNumber: '+1234567890' }),
          },
        },
        { provide: ProviderRouterService, useValue: {} },
        {
          provide: BranchesService,
          useValue: { checkBranchAccess: jest.fn() },
        },
        { provide: DataSource, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MessagingGateway, useValue: {} },
        { provide: PushNotificationService, useValue: {} },
      ],
    }).compile();

    service = module.get<MessagingEngineService>(MessagingEngineService);
  });

  it('should return immediately and process in background for individual messages', async () => {
    const dto = {
      branchId: 'br1',
      customerIds: ['c1', 'c2'],
      content: 'Hello {Name}',
      channel: Channel.WHATSAPP,
    } as any;

    const result = await service.sendMessage(dto);

    expect(result.status).toBe('QUEUED');
    expect(result.message).toBe('Messages queued for delivery');
    expect(mockIndividualQueue.addBulk).toHaveBeenCalledTimes(1);
    expect(mockIndividualQueue.addBulk).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'send-individual',
          data: expect.objectContaining({
            customerId: 'c1',
          }),
        }),
      ]),
    );
  });
});
