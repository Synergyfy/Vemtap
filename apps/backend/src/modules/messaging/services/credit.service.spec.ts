import { Test, TestingModule } from '@nestjs/testing';
import { CreditService } from './credit.service';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Message } from '../entities/message.entity';
import { BusinessCredit } from '../entities/business-credit.entity';
import { BusinessCreditWallet } from '../entities/business-credit-wallet.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Channel } from '../enums/channel.enum';

describe('CreditService', () => {
  let service: CreditService;
  let dataSourceMock: any;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((d) => d),
    save: jest
      .fn()
      .mockImplementation((d) => Promise.resolve({ id: '1', ...d })),
    count: jest.fn(),
  };

  beforeEach(async () => {
    dataSourceMock = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        { provide: getRepositoryToken(Business), useValue: mockRepo },
        { provide: getRepositoryToken(Branch), useValue: mockRepo },
        { provide: getRepositoryToken(Message), useValue: mockRepo },
        { provide: getRepositoryToken(BusinessCredit), useValue: mockRepo },
        { provide: getRepositoryToken(BusinessCreditWallet), useValue: mockRepo },
        { provide: getRepositoryToken(CreditTransaction), useValue: mockRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
  });

  describe('deductCredits', () => {
    it('should deduct credits if balance is sufficient', async () => {
      const mockWallet = { businessId: 'biz1', smsCredits: 10 } as any;
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockWallet),
        save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
        create: jest.fn().mockImplementation((d) => d),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      await service.deductCredits('biz1', Channel.SMS, 5, 'test deduction');

      expect(mockManager.findOne).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
      expect(mockWallet.smsCredits).toBe(5);
    });

    it('should throw BadRequestException if balance is insufficient', async () => {
      const mockWallet = { businessId: 'biz1', smsCredits: 2 } as any;
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockWallet),
        save: jest.fn(),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      await expect(service.deductCredits('biz1', Channel.SMS, 5, 'test deduction')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if wallet is not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      await expect(service.deductCredits('biz1', Channel.SMS, 5, 'test')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
