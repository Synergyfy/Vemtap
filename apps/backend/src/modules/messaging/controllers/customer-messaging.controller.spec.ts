import { Test, TestingModule } from '@nestjs/testing';
import { CustomerMessagingController } from './customer-messaging.controller';
import { InboxService } from '../services/inbox.service';
import { User } from '../../users/entities/user.entity';
import { StartConversationDto } from '../dto/start-conversation.dto';
import { ReplyDto } from '../dto/reply.dto';

describe('CustomerMessagingController', () => {
  let controller: CustomerMessagingController;
  let inboxService: InboxService;

  const mockInboxService = {
    getCustomerThreads: jest.fn(),
    getCustomerThreadMessages: jest.fn(),
    sendCustomerReply: jest.fn(),
    startCustomerConversation: jest.fn(),
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
      );
    });
  });
});
