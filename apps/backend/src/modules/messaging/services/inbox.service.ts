import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  forwardRef,
  Inject,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConversationThread,
  ThreadStatus,
} from '../entities/conversation-thread.entity';
import { Message } from '../entities/message.entity';
import { Channel } from '../enums/channel.enum';
import { MessagingEngineService } from './messaging-engine.service';
import { MessageDirection, MessageStatus } from '../enums/message.enum';
import { User } from '../../users/entities/user.entity';
import { MessagingGateway } from '../messaging.gateway';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { Visit } from '../../visitors/entities/visit.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { AutomationService } from './automation.service';
import { TriggerType } from '../enums/automation.enum';

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @Inject(forwardRef(() => MessagingEngineService))
    private readonly messagingEngine: MessagingEngineService,
    private readonly messagingGateway: MessagingGateway,
    private readonly pushNotificationService: PushNotificationService,
    private readonly automationService: AutomationService,
  ) {}

  async getThreads(
    branchId: string,
    channel: Channel,
    segmentId?: string,
  ): Promise<ConversationThread[]> {
    const query = this.threadRepo
      .createQueryBuilder('thread')
      .leftJoinAndSelect('thread.customer', 'customer')
      .where('thread.branchId = :branchId', { branchId })
      .andWhere('thread.channel = :channel', { channel });

    if (segmentId) {
      query.innerJoin(
        'segment_users',
        'su',
        'su.userId = customer.id AND su.segmentId = :segmentId',
        { segmentId },
      );
    }

    return query.orderBy('thread.lastActivityAt', 'DESC').getMany();
  }

  async getThreadMessages(
    threadId: string,
    branchId: string,
  ): Promise<Message[]> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, branchId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Mark as read for branch when staff views thread
    if (thread.branchUnreadCount > 0) {
      thread.branchUnreadCount = 0;
      await this.threadRepo.save(thread);
    }

    return this.messageRepo.find({
      where: { threadId },
      relations: ['replyTo'],
      order: { timestamp: 'DESC' }, // Newest to oldest as requested
    });
  }

  async markAsRead(
    threadId: string,
    branchId?: string,
    customerId?: string,
  ): Promise<void> {
    const where: any = { id: threadId };
    if (branchId) where.branchId = branchId;
    if (customerId) where.customerId = customerId;

    const thread = await this.threadRepo.findOne({ where });
    if (!thread) throw new NotFoundException('Thread not found');

    if (branchId) {
      thread.branchUnreadCount = 0;
    } else if (customerId) {
      thread.customerUnreadCount = 0;
    }

    await this.threadRepo.save(thread);
  }

  async sendReply(
    threadId: string,
    content: string,
    branchId: string,
    replyToId?: string,
  ): Promise<Message | null> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, branchId },
      relations: ['customer'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const messageId = await this.messagingEngine.sendReply(
      thread,
      content,
      replyToId,
    );
    if (!messageId) {
      throw new InternalServerErrorException('Failed to send reply');
    }

    const savedMessage = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['replyTo'],
    });

    if (savedMessage && replyToId) {
      savedMessage.replyToId = replyToId;
      await this.messageRepo.save(savedMessage);
    }

    // Update thread metadata
    await this.threadRepo.update(thread.id, {
      lastActivityAt: new Date(),
      lastMessageContent: content,
      status: ThreadStatus.OPEN,
    });
    // Atomic increment to prevent race conditions
    await this.threadRepo.increment(
      { id: thread.id },
      'customerUnreadCount',
      1,
    );

    // Broadcast via socket
    this.messagingGateway.emitMessage(
      thread.id,
      thread.branchId,
      thread.customerId,
      savedMessage,
    );

    // Send push notification to visitor
    this.pushNotificationService
      .sendNotification(
        thread.customerId,
        'New Message from Business',
        content,
        { threadId: thread.id, channel: thread.channel },
        true, // Is User (Customer is a User now)
      )
      .catch((e) => console.error('Push error:', e.message));

    return savedMessage;
  }

  async initBranchConversation(
    branchId: string,
    customerId: string,
  ): Promise<ConversationThread> {
    let thread = await this.threadRepo.findOne({
      where: { branchId, customerId, channel: Channel.IN_HOUSE },
      relations: ['customer'],
    });

    if (!thread) {
      const branch = await this.branchRepo.findOne({ where: { id: branchId } });
      if (!branch) throw new NotFoundException('Branch not found');

      const customer = await this.userRepo.findOne({
        where: { id: customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      thread = this.threadRepo.create({
        branchId,
        businessId: branch.businessId,
        customerId,
        channel: Channel.IN_HOUSE,
        status: ThreadStatus.OPEN,
        lastActivityAt: new Date(),
        branchUnreadCount: 0,
        customerUnreadCount: 0,
      });
      thread = await this.threadRepo.save(thread);
      thread.customer = customer;
    }

    return thread;
  }

  async editMessage(
    messageId: string,
    content: string,
    userId: string, // Initiator (User UUID)
    branchId?: string, // If calling from branch context
  ): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['thread'],
    });

    if (!message) throw new NotFoundException('Message not found');

    // Simple permission check: must be sender
    // Note: if branchId is provided, we check if it matches the message branchId (staff context)
    // but we should still ideally check if it was OUTBOUND (staff) or INBOUND (customer)
    if (branchId) {
      if (
        message.direction !== MessageDirection.OUTBOUND ||
        message.branchId !== branchId
      ) {
        throw new ForbiddenException('Cannot edit this message');
      }
    } else {
      if (
        message.direction !== MessageDirection.INBOUND ||
        message.customerId !== userId
      ) {
        throw new ForbiddenException('Cannot edit this message');
      }
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    message.content = content;
    message.isEdited = true;
    const saved = await this.messageRepo.save(message);

    // Broadcast update
    this.messagingGateway.emitMessageUpdate(
      message.threadId,
      message.branchId,
      message.customerId,
      {
        id: message.id,
        content: message.content,
        isEdited: true,
        type: 'EDIT',
      },
    );

    return saved;
  }

  async deleteMessage(
    messageId: string,
    userId: string,
    branchId?: string,
  ): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['thread'],
    });

    if (!message) throw new NotFoundException('Message not found');

    if (branchId) {
      if (
        message.direction !== MessageDirection.OUTBOUND ||
        message.branchId !== branchId
      ) {
        throw new ForbiddenException('Cannot delete this message');
      }
    } else {
      if (
        message.direction !== MessageDirection.INBOUND ||
        message.customerId !== userId
      ) {
        throw new ForbiddenException('Cannot delete this message');
      }
    }

    message.isDeleted = true;
    message.content = 'Message deleted'; // Clear content for privacy, but keep entity
    await this.messageRepo.save(message);

    // Broadcast update
    this.messagingGateway.emitMessageUpdate(
      message.threadId,
      message.branchId,
      message.customerId,
      {
        id: message.id,
        isDeleted: true,
        type: 'DELETE',
      },
    );
  }

  // --- Customer Facing Methods ---

  async getCustomerThreads(customerId: string): Promise<ConversationThread[]> {
    return this.threadRepo.find({
      where: { customerId, channel: Channel.IN_HOUSE },
      relations: ['branch', 'branch.business'],
      order: { lastActivityAt: 'DESC' },
    });
  }

  async findOrCreateCustomerThread(
    customerId: string,
    branchId: string,
  ): Promise<ConversationThread> {
    let thread = await this.threadRepo.findOne({
      where: { customerId, branchId, channel: Channel.IN_HOUSE },
      relations: ['branch', 'branch.business', 'customer'],
    });

    if (!thread) {
      const branch = await this.branchRepo.findOne({
        where: { id: branchId },
        relations: ['business'],
      });
      if (!branch) throw new NotFoundException('Branch not found');

      const customer = await this.userRepo.findOne({
        where: { id: customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      thread = this.threadRepo.create({
        branchId,
        businessId: branch.businessId,
        customerId,
        channel: Channel.IN_HOUSE,
        status: ThreadStatus.OPEN,
        lastActivityAt: new Date(),
        branchUnreadCount: 0,
        customerUnreadCount: 0,
      });
      thread = await this.threadRepo.save(thread);
      thread.branch = branch;
      thread.customer = customer;
    }

    return thread;
  }

  async getCustomerThreadMessages(
    threadId: string,
    customerId: string,
  ): Promise<Message[]> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, customerId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Mark as read for customer when visitor views thread
    if (thread.customerUnreadCount > 0) {
      thread.customerUnreadCount = 0;
      await this.threadRepo.save(thread);
    }

    return this.messageRepo.find({
      where: { threadId },
      relations: ['replyTo'],
      order: { timestamp: 'DESC' }, // Newest to oldest
    });
  }

  async sendCustomerReply(
    threadId: string,
    content: string,
    customerId: string,
    replyToId?: string,
  ): Promise<Message> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, customerId },
      relations: ['customer'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.channel !== Channel.IN_HOUSE) {
      throw new ForbiddenException('Can only reply to In-House messages');
    }

    const message = this.messageRepo.create({
      branchId: thread.branchId,
      customerId: thread.customerId,
      threadId: thread.id,
      content,
      channel: Channel.IN_HOUSE,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.DELIVERED,
      from: thread.customer.phone || thread.customer.email || 'Customer',
      to: thread.branchId,
      replyToId,
      timestamp: new Date(),
    } as any) as unknown as Message;

    const savedMessage = await this.messageRepo.save(message);

    // Update thread metadata
    await this.threadRepo.update(thread.id, {
      lastActivityAt: new Date(),
      lastMessageContent: content,
      status: ThreadStatus.OPEN,
    });
    // Atomic increment to prevent race conditions
    await this.threadRepo.increment({ id: thread.id }, 'branchUnreadCount', 1);

    // Broadcast via socket
    this.messagingGateway.emitMessage(
      thread.id,
      thread.branchId,
      thread.customerId,
      savedMessage,
    );

    // --- Automation Triggers ---
    // 1. Check if first message for Welcome Message
    const msgCount = await this.messageRepo.count({ where: { threadId: thread.id } });
    if (msgCount === 1) {
      await this.automationService.trigger(TriggerType.WELCOME_MESSAGE, {
        branchId: thread.branchId,
        customerId: thread.customerId,
        content,
      });
    }

    // 2. Inbound Message (FAQ)
    await this.automationService.trigger(TriggerType.INBOUND_MESSAGE, {
      branchId: thread.branchId,
      customerId: thread.customerId,
      content,
    });

    // 3. Off Hours Check
    await this.automationService.trigger(TriggerType.OFF_HOURS, {
      branchId: thread.branchId,
      customerId: thread.customerId,
      content,
    });

    return savedMessage;
  }

  async startCustomerConversation(
    customerId: string,
    branchId: string,
    content: string,
  ): Promise<Message> {
    // 1. Verify if the customer has visited the branch
    const visit = await this.visitRepo.findOne({
      where: { customerId, branchId },
    });

    if (!visit) {
      throw new ForbiddenException(
        'You must be a visitor of this branch to start a conversation',
      );
    }

    // 2. Find or create an In-House thread
    let thread = await this.threadRepo.findOne({
      where: { customerId, branchId, channel: Channel.IN_HOUSE },
      relations: ['customer'],
    });

    if (!thread) {
      const branch = await this.branchRepo.findOne({ where: { id: branchId } });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      const customer = await this.userRepo.findOne({
        where: { id: customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      thread = this.threadRepo.create({
        branchId,
        businessId: branch.businessId,
        customerId,
        channel: Channel.IN_HOUSE,
        status: ThreadStatus.OPEN,
        lastActivityAt: new Date(),
        lastMessageContent: content,
        branchUnreadCount: 1,
        customerUnreadCount: 0,
      });
      thread = await this.threadRepo.save(thread);
      thread.customer = customer;
    } else {
      // If thread exists, just update it
      await this.threadRepo.update(thread.id, {
        lastActivityAt: new Date(),
        lastMessageContent: content,
        status: ThreadStatus.OPEN,
      });
      await this.threadRepo.increment(
        { id: thread.id },
        'branchUnreadCount',
        1,
      );
    }

    // 3. Create and save the message
    const message = this.messageRepo.create({
      branchId,
      customerId,
      threadId: thread.id,
      content,
      channel: Channel.IN_HOUSE,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.DELIVERED,
      from: thread.customer.phone || thread.customer.email || 'Customer',
      to: branchId,
      timestamp: new Date(),
    } as any) as unknown as Message;

    const savedMessage = await this.messageRepo.save(message);

    // 4. Broadcast via socket
    this.messagingGateway.emitMessage(
      thread.id,
      thread.branchId,
      thread.customerId,
      savedMessage,
    );

    // 5. Send push notification to branch staff
    this.pushNotificationService
      .sendToBranchStaff(
        thread.branchId,
        `New Message from ${thread.customer.firstName || 'Visitor'}`,
        content,
        { threadId: thread.id, channel: thread.channel },
      )
      .catch((e) => console.error('Push error:', e.message));

    // --- Automation Triggers ---
    // Since startCustomerConversation always creates the first message
    await this.automationService.trigger(TriggerType.WELCOME_MESSAGE, {
      branchId,
      customerId,
      content,
    });

    await this.automationService.trigger(TriggerType.INBOUND_MESSAGE, {
      branchId,
      customerId,
      content,
    });

    await this.automationService.trigger(TriggerType.OFF_HOURS, {
      branchId,
      customerId,
      content,
    });

    return savedMessage;
  }

  async closeInactiveThreads(days: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await this.threadRepo
      .createQueryBuilder()
      .update(ConversationThread)
      .set({ status: ThreadStatus.CLOSED })
      .where('lastActivityAt < :cutoffDate AND status != :closedStatus', {
        cutoffDate,
        closedStatus: ThreadStatus.CLOSED,
      })
      .execute();
  }
}
