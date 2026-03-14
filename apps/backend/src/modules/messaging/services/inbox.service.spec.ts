import { Test, TestingModule } from '@nestjs/testing';
import { InboxService } from './inbox.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConversationThread,
  ThreadStatus,
} from '../entities/conversation-thread.entity';
import { Message } from '../entities/message.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Contact } from '../../contacts/entities/contact.entity';
import { Channel } from '../enums/channel.enum';

describe('InboxService', () => {
  let service: InboxService;
  let threadRepoMock: any;
  let messageRepoMock: any;
  let contactRepoMock: any;
  let engineMock: any;

  beforeEach(async () => {
    threadRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
    };

    // We replace query builder to just return execute() for testing
    threadRepoMock.createQueryBuilder = jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    }));

    messageRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((m) => m),
      save: jest.fn().mockImplementation((m) => Promise.resolve(m)),
    };

    contactRepoMock = {
        findOne: jest.fn(),
    };

    engineMock = {
      sendReply: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboxService,
        {
          provide: getRepositoryToken(ConversationThread),
          useValue: threadRepoMock,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: messageRepoMock,
        },
        {
          provide: getRepositoryToken(Contact),
          useValue: contactRepoMock,
        },
        {
          provide: MessagingEngineService,
          useValue: engineMock,
        },
      ],
    }).compile();

    service = module.get<InboxService>(InboxService);
  });

  describe('sendReply', () => {
    it('should throw NotFoundException if thread does not exist', async () => {
      threadRepoMock.findOne.mockResolvedValue(null);
      await expect(service.sendReply('t1', 'hello', 'br1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should send reply via engine, update thread status to OPEN, and return message', async () => {
      const mockThread = {
        id: 't1',
        branchId: 'br1',
        status: ThreadStatus.CLOSED,
      } as any;
      threadRepoMock.findOne.mockResolvedValue(mockThread);
      engineMock.sendReply.mockResolvedValue('msg1');
      messageRepoMock.findOne.mockResolvedValue({
        id: 'msg1',
        content: 'hello',
      } as any);

      const result = await service.sendReply('t1', 'hello', 'br1');

      expect(engineMock.sendReply).toHaveBeenCalledWith(mockThread, 'hello');
      expect(mockThread.status).toBe(ThreadStatus.OPEN);
      expect(threadRepoMock.save).toHaveBeenCalledWith(mockThread);
      expect(result).toBeDefined();
      expect(result!.content).toBe('hello');
    });
  });

  describe('closeInactiveThreads', () => {
    it('should execute query builder to update inactive threads', async () => {
      await service.closeInactiveThreads(7);
      expect(threadRepoMock.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('Customer In-House Messaging', () => {
    describe('getCustomerThreads', () => {
        it('should return in-house threads for a given contact', async () => {
            const mockThreads = [{ id: 't1', channel: Channel.IN_HOUSE }];
            threadRepoMock.find.mockResolvedValue(mockThreads);

            const result = await service.getCustomerThreads('contact-1');
            expect(threadRepoMock.find).toHaveBeenCalledWith({
                where: { contactId: 'contact-1', channel: Channel.IN_HOUSE },
                relations: ['branch', 'branch.business'],
                order: { lastActivityAt: 'DESC' },
            });
            expect(result).toEqual(mockThreads);
        });
    });

    describe('getCustomerThreadMessages', () => {
        it('should throw NotFoundException if thread does not exist for contact', async () => {
            threadRepoMock.findOne.mockResolvedValue(null);
            await expect(service.getCustomerThreadMessages('t1', 'contact-1')).rejects.toThrow(NotFoundException);
        });

        it('should return messages for the thread', async () => {
            threadRepoMock.findOne.mockResolvedValue({ id: 't1', contactId: 'contact-1' });
            const mockMessages = [{ id: 'm1', content: 'test' }];
            messageRepoMock.find.mockResolvedValue(mockMessages);

            const result = await service.getCustomerThreadMessages('t1', 'contact-1');
            expect(messageRepoMock.find).toHaveBeenCalledWith({
                where: { threadId: 't1' },
                order: { timestamp: 'ASC' },
            });
            expect(result).toEqual(mockMessages);
        });
    });

    describe('sendCustomerReply', () => {
        it('should throw NotFoundException if thread does not exist', async () => {
            threadRepoMock.findOne.mockResolvedValue(null);
            await expect(service.sendCustomerReply('t1', 'hello', 'contact-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if thread channel is not IN_HOUSE', async () => {
            threadRepoMock.findOne.mockResolvedValue({ id: 't1', channel: Channel.SMS });
            await expect(service.sendCustomerReply('t1', 'hello', 'contact-1')).rejects.toThrow(ForbiddenException);
        });

        it('should save customer reply and update thread status', async () => {
            const mockThread = {
                id: 't1',
                branchId: 'br1',
                contactId: 'contact-1',
                channel: Channel.IN_HOUSE,
                status: ThreadStatus.CLOSED,
                contact: { phone: '123456' }
            };
            threadRepoMock.findOne.mockResolvedValue(mockThread);
            
            const result = await service.sendCustomerReply('t1', 'reply content', 'contact-1');

            expect(messageRepoMock.create).toHaveBeenCalled();
            expect(messageRepoMock.save).toHaveBeenCalled();
            expect(mockThread.status).toBe(ThreadStatus.OPEN);
            expect(threadRepoMock.save).toHaveBeenCalledWith(mockThread);
            expect(result.content).toBe('reply content');
        });
    });
  });
});

