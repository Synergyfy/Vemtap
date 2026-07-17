import { Test, TestingModule } from '@nestjs/testing';
import { InboxService } from './inbox.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConversationThread,
  ThreadStatus,
} from '../entities/conversation-thread.entity';
import { Message } from '../entities/message.entity';
import { MessagingEngineService } from './messaging-engine.service';
import {
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { Channel } from '../enums/channel.enum';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { Visit } from '../../visitors/entities/visit.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { MessageDirection } from '../enums/message.enum';
import { AutomationService } from './automation.service';

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
  let automationMock: any;

  beforeEach(async () => {
    threadRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((t) =>
          Promise.resolve({ id: 'new-thread-id', ...t }),
        ),
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
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((m) => m),
      save: jest
        .fn()
        .mockImplementation((m) => Promise.resolve({ id: 'new-msg-id', ...m })),
    };

    userRepoMock = {
      findOne: jest.fn(),
    };

    visitRepoMock = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'new-visit-id', ...v })),
    };

    branchRepoMock = {
      findOne: jest.fn(),
    };

    engineMock = {
      sendReply: jest.fn(),
    };

    gatewayMock = {
      emitMessage: jest.fn(),
      emitMessageUpdate: jest.fn(),
    };

    pushMock = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
      sendToBranchStaff: jest.fn().mockResolvedValue({ success: true }),
    };

    automationMock = {
      handleEvent: jest.fn().mockResolvedValue({}),
      trigger: jest.fn().mockResolvedValue({}),
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
        {
          provide: AutomationService,
          useValue: automationMock,
        },
      ],
    }).compile();

    service = module.get<InboxService>(InboxService);
  });

  describe('getThreads', () => {
    it('should return threads for a branch and channel', async () => {
      const branchId = 'br1';
      const channel = Channel.IN_HOUSE;
      const mockThreads = [{ id: 't1' }, { id: 't2' }];

      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockThreads),
      };
      threadRepoMock.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getThreads(branchId, channel);

      expect(result).toEqual(mockThreads);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'thread.branchId = :branchId',
        { branchId },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'thread.channel = :channel',
        { channel },
      );
      expect(queryBuilder.innerJoin).not.toHaveBeenCalled();
    });

    it('should filter by segmentId if provided', async () => {
      const branchId = 'br1';
      const channel = Channel.IN_HOUSE;
      const segmentId = 'seg-1';

      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      threadRepoMock.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.getThreads(branchId, channel, segmentId);

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'segment_users',
        'su',
        'su.userId = customer.id AND su.segmentId = :segmentId',
        { segmentId },
      );
    });
  });

  describe('startCustomerConversation', () => {
    const branch = { id: 'br1', businessId: 'bus1' };
    const customer = { id: 'c1', firstName: 'John', phone: null, email: 'j@test.com' };

    it('should auto-create a chat visit and new thread when customer has no prior visit', async () => {
      // No prior visit
      visitRepoMock.findOne.mockResolvedValue(null);
      branchRepoMock.findOne.mockResolvedValue(branch);
      userRepoMock.findOne.mockResolvedValue(customer);
      threadRepoMock.findOne.mockResolvedValue(null);

      const result = await service.startCustomerConversation('c1', 'br1', 'hello branch');

      // Visit upsert should have been called with visitType='chat'
      expect(visitRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'c1',
          branchId: 'br1',
          visitType: 'chat',
          status: 'new',
        }),
      );
      expect(visitRepoMock.save).toHaveBeenCalled();

      // Thread and message should be created
      expect(threadRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'br1',
          customerId: 'c1',
          channel: Channel.IN_HOUSE,
        }),
      );
      expect(threadRepoMock.save).toHaveBeenCalled();
      expect(messageRepoMock.save).toHaveBeenCalled();
      expect(gatewayMock.emitMessage).toHaveBeenCalled();
      expect(result.content).toBe('hello branch');
    });

    it('should skip visit creation and create a new thread when customer already has a visit', async () => {
      // Existing visit present
      visitRepoMock.findOne.mockResolvedValue({ id: 'v1' });
      branchRepoMock.findOne.mockResolvedValue(branch);
      userRepoMock.findOne.mockResolvedValue(customer);
      threadRepoMock.findOne.mockResolvedValue(null);

      await service.startCustomerConversation('c1', 'br1', 'hello branch');

      // Visit upsert should NOT have run
      expect(visitRepoMock.create).not.toHaveBeenCalled();
      expect(visitRepoMock.save).not.toHaveBeenCalled();

      expect(threadRepoMock.save).toHaveBeenCalled();
      expect(messageRepoMock.save).toHaveBeenCalled();
    });

    it('should reuse existing thread and skip thread creation', async () => {
      visitRepoMock.findOne.mockResolvedValue({ id: 'v1' });
      branchRepoMock.findOne.mockResolvedValue(branch);
      userRepoMock.findOne.mockResolvedValue(customer);
      const existingThread = {
        id: 't1',
        branchId: 'br1',
        customerId: 'c1',
        customer: { firstName: 'John' },
      };
      threadRepoMock.findOne.mockResolvedValue(existingThread);

      await service.startCustomerConversation('c1', 'br1', 'another message');

      expect(threadRepoMock.create).not.toHaveBeenCalled();
      expect(threadRepoMock.update).toHaveBeenCalledWith(
        't1',
        expect.any(Object),
      );
      expect(messageRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: 't1',
          content: 'another message',
        }),
      );
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

      expect(engineMock.sendReply).toHaveBeenCalledWith(
        mockThread,
        'hello',
        undefined,
        undefined,
      );
      expect(threadRepoMock.update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({
          lastMessageContent: 'hello',
          status: ThreadStatus.OPEN,
        }),
      );
      expect(threadRepoMock.increment).toHaveBeenCalledWith(
        { id: 't1' },
        'customerUnreadCount',
        1,
      );
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

      expect(messageRepoMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { timestamp: 'ASC' },
        }),
      );
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
        customer: { firstName: 'Visitor', phone: '+123' },
      } as any;
      threadRepoMock.findOne.mockResolvedValue(mockThread);

      const result = await service.sendCustomerReply(
        't1',
        'reply content',
        'c1',
      );

      expect(messageRepoMock.save).toHaveBeenCalled();
      expect(threadRepoMock.update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({
          lastMessageContent: 'reply content',
          status: ThreadStatus.OPEN,
        }),
      );
      expect(threadRepoMock.increment).toHaveBeenCalledWith(
        { id: 't1' },
        'branchUnreadCount',
        1,
      );
      expect(gatewayMock.emitMessage).toHaveBeenCalled();
      // Push notification is now handled via Automation trigger
      expect(automationMock.trigger).toHaveBeenCalled();
      expect(result.content).toBe('reply content');
    });
  });

  describe('editMessage', () => {
    it('should edit message and broadcast', async () => {
      const mockMsg: any = {
        id: 'm1',
        content: 'old',
        direction: MessageDirection.OUTBOUND,
        branchId: 'br1',
        threadId: 't1',
      };
      messageRepoMock.findOne.mockResolvedValue(mockMsg);
      messageRepoMock.save.mockImplementation((m) => Promise.resolve(m));

      const result = await service.editMessage('m1', 'new', 'staff-1', 'br1');

      expect(result.content).toBe('new');
      expect(result.isEdited).toBe(true);
      expect(gatewayMock.emitMessageUpdate).toHaveBeenCalled();
    });

    it('should throw Forbidden if non-sender tries to edit', async () => {
      const mockMsg = {
        id: 'm1',
        direction: MessageDirection.INBOUND,
        customerId: 'customer-1',
      };
      messageRepoMock.findOne.mockResolvedValue(mockMsg);

      await expect(
        service.editMessage('m1', 'new', 'other-customer'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteMessage', () => {
    it('should mark message as deleted and clear content', async () => {
      const mockMsg: any = {
        id: 'm1',
        direction: MessageDirection.INBOUND,
        customerId: 'c1',
        threadId: 't1',
      };
      messageRepoMock.findOne.mockResolvedValue(mockMsg);

      await service.deleteMessage('m1', 'c1');

      expect(mockMsg.isDeleted).toBe(true);
      expect(mockMsg.content).toBe('Message deleted');
      expect(gatewayMock.emitMessageUpdate).toHaveBeenCalled();
    });
  });
});
