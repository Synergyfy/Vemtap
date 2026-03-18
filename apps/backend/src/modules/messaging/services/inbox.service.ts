import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
  ForbiddenException,
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

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(forwardRef(() => MessagingEngineService))
    private readonly messagingEngine: MessagingEngineService,
    private readonly messagingGateway: MessagingGateway,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async getThreads(
    branchId: string,
    channel: Channel,
  ): Promise<ConversationThread[]> {
    return this.threadRepo.find({
      where: { branchId, channel },
      relations: ['customer'],
      order: { lastActivityAt: 'DESC' },
    });
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

  async markAsRead(threadId: string, branchId?: string, customerId?: string): Promise<void> {
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

    const messageId = await this.messagingEngine.sendReply(thread, content, replyToId);
    if (!messageId) {
      return null;
    }

    const savedMessage = await this.messageRepo.findOne({ 
      where: { id: messageId },
      relations: ['replyTo'],
    });

    if (savedMessage && replyToId) {
      savedMessage.replyToId = replyToId;
      await this.messageRepo.save(savedMessage);
    }

    thread.lastActivityAt = new Date();
    thread.lastMessageContent = content;
    thread.status = ThreadStatus.OPEN;
    thread.customerUnreadCount += 1; // Increment for visitor
    await this.threadRepo.save(thread);

    // Broadcast via socket
    this.messagingGateway.emitMessage(
      thread.id,
      thread.branchId,
      thread.customerId,
      savedMessage,
    );

    // Send push notification to visitor
    this.pushNotificationService.sendNotification(
      thread.customerId,
      'New Message from Business',
      content,
      { threadId: thread.id, channel: thread.channel },
      true, // Is User (Customer is a User now)
    ).catch(e => console.error('Push error:', e.message));

    return savedMessage;
  }

  // --- Customer Facing Methods ---

  async getCustomerThreads(customerId: string): Promise<ConversationThread[]> {
    return this.threadRepo.find({
      where: { customerId, channel: Channel.IN_HOUSE },
      relations: ['branch', 'branch.business'],
      order: { lastActivityAt: 'DESC' },
    });
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

    thread.lastActivityAt = new Date();
    thread.lastMessageContent = content;
    thread.status = ThreadStatus.OPEN;
    thread.branchUnreadCount += 1; // Increment for staff
    await this.threadRepo.save(thread);

    // Broadcast via socket
    this.messagingGateway.emitMessage(
      thread.id,
      thread.branchId,
      thread.customerId,
      savedMessage,
    );

    // Send push notification to branch staff
    this.pushNotificationService.sendToBranchStaff(
      thread.branchId,
      `New Message from ${thread.customer.firstName || 'Visitor'}`,
      content,
      { threadId: thread.id, channel: thread.channel },
    ).catch(e => console.error('Push error:', e.message));

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
