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
import { User } from '../../users/entities/user.entity';
import { Channel } from '../enums/channel.enum';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';

describe('InboxService', () => {
  let service: InboxService;
  let threadRepoMock: any;
  let messageRepoMock: any;
  let userRepoMock: any;
  let engineMock: any;
  let gatewayMock: any;
  let pushMock: any;

  beforeEach(async () => {
    threadRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
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
      save: jest.fn().mockImplementation((m) => Promise.resolve(m)),
    };

    userRepoMock = {
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

  describe('sendReply', () => {
    it('should throw NotFoundException if thread does not exist', async () => {
      threadRepoMock.findOne.mockResolvedValue(null);
      await expect(service.sendReply('t1', 'hello', 'br1')).rejects.toThrow(
        NotFoundException,
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
      expect(mockThread.status).toBe(ThreadStatus.OPEN);
      expect(mockThread.customerUnreadCount).toBe(1);
      expect(mockThread.lastMessageContent).toBe('hello');
      expect(threadRepoMock.save).toHaveBeenCalledWith(mockThread);
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
      expect(mockThread.branchUnreadCount).toBe(1);
      expect(gatewayMock.emitMessage).toHaveBeenCalled();
      expect(pushMock.sendToBranchStaff).toHaveBeenCalled();
      expect(result.content).toBe('reply content');
    });
  });
});
