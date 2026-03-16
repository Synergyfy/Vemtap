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
import { Contact } from '../../contacts/entities/contact.entity';

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @Inject(forwardRef(() => MessagingEngineService))
    private readonly messagingEngine: MessagingEngineService,
  ) {}

  async getThreads(
    branchId: string,
    channel: Channel,
  ): Promise<ConversationThread[]> {
    return this.threadRepo.find({
      where: { branchId, channel },
      relations: ['contact'],
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

    return this.messageRepo.find({
      where: { threadId },
      order: { timestamp: 'ASC' },
    });
  }

  async sendReply(
    threadId: string,
    content: string,
    branchId: string,
  ): Promise<Message | null> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, branchId },
      relations: ['contact'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const messageId = await this.messagingEngine.sendReply(thread, content);
    if (!messageId) {
      return null;
    }

    thread.lastActivityAt = new Date();
    thread.status = ThreadStatus.OPEN;
    await this.threadRepo.save(thread);

    return this.messageRepo.findOne({ where: { id: messageId } });
  }

  // --- Customer Facing Methods ---

  async getCustomerThreads(contactId: string): Promise<ConversationThread[]> {
    return this.threadRepo.find({
      where: { contactId, channel: Channel.IN_HOUSE },
      relations: ['branch', 'branch.business'],
      order: { lastActivityAt: 'DESC' },
    });
  }

  async getCustomerThreadMessages(
    threadId: string,
    contactId: string,
  ): Promise<Message[]> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, contactId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return this.messageRepo.find({
      where: { threadId },
      order: { timestamp: 'ASC' },
    });
  }

  async sendCustomerReply(
    threadId: string,
    content: string,
    contactId: string,
  ): Promise<Message> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, contactId },
      relations: ['contact'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.channel !== Channel.IN_HOUSE) {
      throw new ForbiddenException('Can only reply to In-House messages');
    }

    const message = this.messageRepo.create({
      branchId: thread.branchId,
      contactId: thread.contactId,
      threadId: thread.id,
      content,
      channel: Channel.IN_HOUSE,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.DELIVERED,
      from: thread.contact.phone || thread.contact.email || 'Customer',
      to: thread.branchId,
      timestamp: new Date(),
    } as any) as unknown as Message;

    const savedMessage = await this.messageRepo.save(message);

    thread.lastActivityAt = new Date();
    thread.status = ThreadStatus.OPEN;
    await this.threadRepo.save(thread);

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
