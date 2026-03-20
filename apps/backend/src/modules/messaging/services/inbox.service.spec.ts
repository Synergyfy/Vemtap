import { Test, TestingModule } from '@nestjs/testing';
import { InboxService } from './inbox.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConversationThread,
  ThreadStatus,
} from '../entities/conversation-thread.entity';
import { Message } from '../entities/message.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { Channel } from '../enums/channel.enum';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { Visit } from '../../visitors/entities/visit.entity';
import { Branch } from '../../branches/entities/branch.entity';

describe('InboxService', () => {
  let service: InboxService;
  let threadRepoMock: any;
  let messageRepoMock: any;
  let userRepoMock: any;
  let visitRepoMock: any;
  let branchRepoMock: any;
  let engineMock: any;
  let gatewayMock: any;
  let pushMock: any;

  beforeEach(async () => {
    threadRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((t) => Promise.resolve({ id: 'new-thread-id', ...t })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      increment: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn().mockImplementation((t) => t),
    };

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
      save: jest.fn().mockImplementation((m) => Promise.resolve({ id: 'new-msg-id', ...m })),
    };

    userRepoMock = {
        findOne: jest.fn(),
    };

    visitRepoMock = {
      findOne: jest.fn(),
    };

    branchRepoMock = {
      findOne: jest.fn(),
    };

    engineMock = {
      sendReply: jest.fn(),
    };

    gatewayMock = {
      emitMessage: jest.fn(),
    };

    pushMock = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
      sendToBranchStaff: jest.fn().mockResolvedValue({ success: true }),
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
          provide: getRepositoryToken(User),
          useValue: userRepoMock,
        },
        {
          provide: getRepositoryToken(Visit),
          useValue: visitRepoMock,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: branchRepoMock,
        },
        {
          provide: MessagingEngineService,
          useValue: engineMock,
        },
        {
          provide: MessagingGateway,
          useValue: gatewayMock,
        },
        {
          provide: PushNotificationService,
          useValue: pushMock,
        },
      ],
    }).compile();

    service = module.get<InboxService>(InboxService);
  });

  describe('startCustomerConversation', () => {
    it('should throw ForbiddenException if customer has not visited the branch', async () => {
      visitRepoMock.findOne.mockResolvedValue(null);
      await expect(service.startCustomerConversation('c1', 'br1', 'hi')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create a new thread and message if no thread exists', async () => {
      visitRepoMock.findOne.mockResolvedValue({ id: 'v1' });
      threadRepoMock.findOne.mockResolvedValue(null);
      branchRepoMock.findOne.mockResolvedValue({ id: 'br1', businessId: 'bus1' });
      userRepoMock.findOne.mockResolvedValue({ id: 'c1', firstName: 'John' });

      const result = await service.startCustomerConversation('c1', 'br1', 'hello branch');

      expect(threadRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({
        branchId: 'br1',
        customerId: 'c1',
        channel: Channel.IN_HOUSE,
      }));
      expect(threadRepoMock.save).toHaveBeenCalled();
      expect(messageRepoMock.save).toHaveBeenCalled();
      expect(gatewayMock.emitMessage).toHaveBeenCalled();
      expect(result.content).toBe('hello branch');
    });

    it('should reuse existing thread if it exists', async () => {
      visitRepoMock.findOne.mockResolvedValue({ id: 'v1' });
      const existingThread = { id: 't1', branchId: 'br1', customerId: 'c1', customer: { firstName: 'John' } };
      threadRepoMock.findOne.mockResolvedValue(existingThread);

      await service.startCustomerConversation('c1', 'br1', 'another message');

      expect(threadRepoMock.create).not.toHaveBeenCalled();
      expect(threadRepoMock.update).toHaveBeenCalledWith('t1', expect.any(Object));
      expect(messageRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({
        threadId: 't1',
        content: 'another message',
      }));
    });
  });

  describe('sendReply', () => {
    it('should throw NotFoundException if thread does not exist', async () => {
      threadRepoMock.findOne.mockResolvedValue(null);
      await expect(service.sendReply('t1', 'hello', 'br1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if engine returns null', async () => {
      const mockThread = {
        id: 't1',
        branchId: 'br1',
        customerId: 'c1',
        status: ThreadStatus.CLOSED,
        customerUnreadCount: 0,
        channel: Channel.IN_HOUSE,
      } as any;
      threadRepoMock.findOne.mockResolvedValue(mockThread);
      engineMock.sendReply.mockResolvedValue(null);

      await expect(service.sendReply('t1', 'hello', 'br1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should send reply via engine, update thread status, unread count, and broadcast', async () => {
      const mockThread = {
        id: 't1',
        branchId: 'br1',
        customerId: 'c1',
        status: ThreadStatus.CLOSED,
        customerUnreadCount: 0,
        channel: Channel.IN_HOUSE,
      } as any;
      threadRepoMock.findOne.mockResolvedValue(mockThread);
      engineMock.sendReply.mockResolvedValue('msg1');
      messageRepoMock.findOne.mockResolvedValue({
        id: 'msg1',
        content: 'hello',
        threadId: 't1',
      } as any);

      const result = await service.sendReply('t1', 'hello', 'br1');

      expect(engineMock.sendReply).toHaveBeenCalledWith(mockThread, 'hello', undefined);
      expect(threadRepoMock.update).toHaveBeenCalledWith('t1', expect.objectContaining({
        lastMessageContent: 'hello',
        status: ThreadStatus.OPEN,
      }));
      expect(threadRepoMock.increment).toHaveBeenCalledWith({ id: 't1' }, 'customerUnreadCount', 1);
      expect(gatewayMock.emitMessage).toHaveBeenCalled();
      expect(pushMock.sendNotification).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getThreadMessages', () => {
    it('should return messages sorted DESC by timestamp and reset unread count', async () => {
      const mockThread = { id: 't1', branchId: 'br1', branchUnreadCount: 5 };
      threadRepoMock.findOne.mockResolvedValue(mockThread);
      messageRepoMock.find.mockResolvedValue([{ id: 'm1' }]);

      const result = await service.getThreadMessages('t1', 'br1');

      expect(messageRepoMock.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { timestamp: 'DESC' }
      }));
      expect(mockThread.branchUnreadCount).toBe(0);
      expect(threadRepoMock.save).toHaveBeenCalledWith(mockThread);
      expect(result).toHaveLength(1);
    });
  });

  describe('sendCustomerReply', () => {
    it('should save customer reply, update staff unread count, and broadcast', async () => {
      const mockThread = {
        id: 't1',
        branchId: 'br1',
        customerId: 'c1',
        channel: Channel.IN_HOUSE,
        status: ThreadStatus.CLOSED,
        branchUnreadCount: 0,
        customer: { firstName: 'Visitor', phone: '+123' }
      } as any;
      threadRepoMock.findOne.mockResolvedValue(mockThread);
      
      const result = await service.sendCustomerReply('t1', 'reply content', 'c1');

      expect(messageRepoMock.save).toHaveBeenCalled();
      expect(threadRepoMock.update).toHaveBeenCalledWith('t1', expect.objectContaining({
        lastMessageContent: 'reply content',
        status: ThreadStatus.OPEN,
      }));
      expect(threadRepoMock.increment).toHaveBeenCalledWith({ id: 't1' }, 'branchUnreadCount', 1);
      expect(gatewayMock.emitMessage).toHaveBeenCalled();
      expect(pushMock.sendToBranchStaff).toHaveBeenCalled();
      expect(result.content).toBe('reply content');
    });
  });
});
