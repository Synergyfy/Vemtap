import { Test, TestingModule } from '@nestjs/testing';
import { CustomerMessagingController } from './customer-messaging.controller';
import { InboxService } from '../services/inbox.service';
import { User } from '../../users/entities/user.entity';
import { StartConversationDto } from '../dto/start-conversation.dto';
import { ReplyDto } from '../dto/reply.dto';
import { NotFoundException } from '@nestjs/common';

describe('CustomerMessagingController', () => {
  let controller: CustomerMessagingController;
  let inboxService: InboxService;

  const mockInboxService = {
    getCustomerThreads: jest.fn(),
    getCustomerThreadMessages: jest.fn(),
    sendCustomerReply: jest.fn(),
    startCustomerConversation: jest.fn(),
    deleteThread: jest.fn(),
    markAsRead: jest.fn(),
  };

  const mockUser = { id: 'user-1' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerMessagingController],
      providers: [
        {
          provide: InboxService,
          useValue: mockInboxService,
        },
      ],
    }).compile();

    controller = module.get<CustomerMessagingController>(
      CustomerMessagingController,
    );
    inboxService = module.get<InboxService>(InboxService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getThreads', () => {
    it('should call inboxService.getCustomerThreads', async () => {
      await controller.getThreads({ user: mockUser });
      expect(inboxService.getCustomerThreads).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('startConversation', () => {
    it('should call inboxService.startCustomerConversation', async () => {
      const dto: StartConversationDto = { branchId: 'br-1', content: 'hello' };
      await controller.startConversation(dto, { user: mockUser });
      expect(inboxService.startCustomerConversation).toHaveBeenCalledWith(
        mockUser.id,
        dto.branchId,
        dto.content,
        {
          subjectType: undefined,
          claimId: undefined,
          orderId: undefined,
        },
      );
    });
  });

  describe('getThreadMessages', () => {
    it('should call inboxService.getCustomerThreadMessages', async () => {
      await controller.getThreadMessages(
        { threadId: 't-1' },
        { user: mockUser },
      );
      expect(inboxService.getCustomerThreadMessages).toHaveBeenCalledWith(
        't-1',
        mockUser.id,
      );
    });
  });

  describe('replyToThread', () => {
    it('should call inboxService.sendCustomerReply', async () => {
      const dto: ReplyDto = { content: 'reply', replyToId: 'm-1' };
      await controller.replyToThread({ threadId: 't-1' }, dto, {
        user: mockUser,
      });
      expect(inboxService.sendCustomerReply).toHaveBeenCalledWith(
        't-1',
        dto.content,
        mockUser.id,
        dto.replyToId,
        undefined,
        // `media` is forwarded as-is; this DTO carries none.
        { mimeType: undefined, url: undefined },
      );
    });
  });

  describe('markThreadAsRead', () => {
    it('should scope the clear to the calling customer', async () => {
      await controller.markThreadAsRead({ threadId: 'th-1' }, { user: mockUser });
      // The third argument is the customer scope: without it the service would
      // take the branch branch of the method and zero the wrong counter.
      expect(inboxService.markAsRead).toHaveBeenCalledWith(
        'th-1',
        undefined,
        mockUser.id,
      );
    });

    it('should reject a thread belonging to another customer', async () => {
      mockInboxService.markAsRead.mockRejectedValueOnce(
        new NotFoundException('Thread not found'),
      );

      await expect(
        controller.markThreadAsRead({ threadId: 'other' }, { user: mockUser }),
      ).rejects.toThrow('Thread not found');
    });
  });

  describe('deleteThread', () => {
    it('should call inboxService.deleteThread scoped to the customer', async () => {
      await controller.deleteThread({ threadId: 't-1' }, { user: mockUser });

      expect(inboxService.deleteThread).toHaveBeenCalledWith('t-1', {
        customerId: mockUser.id,
      });
    });
  });
});
