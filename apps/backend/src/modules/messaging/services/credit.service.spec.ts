import { Test, TestingModule } from '@nestjs/testing';
import { CreditService } from './credit.service';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Business } from '../../businesses/entities/business.entity';
import { Message } from '../entities/message.entity';
import { BusinessCredit } from '../entities/business-credit.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

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
        { provide: getRepositoryToken(Message), useValue: mockRepo },
        { provide: getRepositoryToken(BusinessCredit), useValue: mockRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
  });

  describe('deduct', () => {
    it('should deduct credits if balance is sufficient', async () => {
      const mockBusiness = { id: 'b1', balance: 10 } as any;
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockBusiness),
        save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      await service.deduct('b1', 5, 'test deduction');

      expect(mockManager.findOne).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
      expect(mockBusiness.balance).toBe(5);
    });

    it('should throw BadRequestException if balance is insufficient', async () => {
      const mockBusiness = { id: 'b1', balance: 2 } as any;
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockBusiness),
        save: jest.fn(),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      await expect(service.deduct('b1', 5, 'test deduction')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if business is not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSourceMock.transaction.mockImplementation(async (cb) => {
        return cb(mockManager);
      });

      await expect(service.deduct('b1', 5, 'test')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
