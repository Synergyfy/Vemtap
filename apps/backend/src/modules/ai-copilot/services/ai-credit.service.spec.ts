import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { AiCreditService } from './ai-credit.service';
import { AiCreditUsage } from '../entities/ai-credit-usage.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/subscription.entity';
import { CreditService } from '../../messaging/services/credit.service';
import { Channel } from '../../messaging/enums/channel.enum';

describe('AiCreditService', () => {
  let service: AiCreditService;
  let usageRepoMock: any;
  let subscriptionRepoMock: any;
  let creditServiceMock: any;
  let dataSourceMock: any;

  beforeEach(async () => {
    usageRepoMock = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'usage-1', ...dto })),
      save: jest.fn((dto) => Promise.resolve(dto)),
      increment: jest.fn().mockResolvedValue(true),
    };

    subscriptionRepoMock = {
      findOne: jest.fn(),
    };

    creditServiceMock = {
      getOrCreateWallet: jest.fn().mockResolvedValue({
        businessId: 'biz-1',
        aiCredits: 50,
        smsCredits: 0,
        emailCredits: 0,
        whatsappCredits: 0,
      }),
      deductCredits: jest.fn().mockResolvedValue(undefined),
    };

    dataSourceMock = {
      query: jest.fn().mockResolvedValue([{ used: 1 }]),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCreditService,
        {
          provide: getRepositoryToken(AiCreditUsage),
          useValue: usageRepoMock,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepoMock,
        },
        {
          provide: CreditService,
          useValue: creditServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<AiCreditService>(AiCreditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should calculate available credits combining plan limit and wallet AI top-up credits', async () => {
      subscriptionRepoMock.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { aiCredits: 10, aiCopilotEnabled: true },
      });

      usageRepoMock.findOne.mockResolvedValue({
        id: 'usage-1',
        businessId: 'biz-1',
        used: 2,
      });

      const status = await service.getStatus('biz-1');

      expect(status.enabled).toBe(true);
      expect(status.limit).toBe(10);
      expect(status.used).toBe(2);
      expect(status.walletCredits).toBe(50);
      expect(status.available).toBe(58); // (10 - 2) + 50
    });
  });

  describe('consume', () => {
    it('should consume from monthly plan quota when quota is available', async () => {
      subscriptionRepoMock.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { aiCredits: 10, aiCopilotEnabled: true },
      });

      usageRepoMock.findOne.mockResolvedValue({
        id: 'usage-1',
        businessId: 'biz-1',
        used: 2,
      });

      dataSourceMock.query.mockResolvedValue([{ used: 3 }]);

      await service.consume('biz-1');

      expect(dataSourceMock.query).toHaveBeenCalled();
      expect(creditServiceMock.deductCredits).not.toHaveBeenCalled();
    });

    it('should fall back to wallet top-up credits when monthly plan quota is exhausted', async () => {
      subscriptionRepoMock.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { aiCredits: 5, aiCopilotEnabled: true },
      });

      usageRepoMock.findOne.mockResolvedValue({
        id: 'usage-1',
        businessId: 'biz-1',
        used: 5, // Quota exhausted
      });

      await service.consume('biz-1');

      expect(creditServiceMock.deductCredits).toHaveBeenCalledWith(
        'biz-1',
        Channel.AI,
        1,
        'AI Copilot Request',
      );
    });

    it('should throw ForbiddenException if both monthly plan quota and wallet top-up credits are exhausted', async () => {
      subscriptionRepoMock.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        plan: { aiCredits: 5, aiCopilotEnabled: true },
      });

      usageRepoMock.findOne.mockResolvedValue({
        id: 'usage-1',
        businessId: 'biz-1',
        used: 5,
      });

      creditServiceMock.deductCredits.mockRejectedValue(
        new Error('Insufficient AI credits'),
      );

      await expect(service.consume('biz-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
