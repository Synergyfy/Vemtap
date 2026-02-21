import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationThread, ThreadStatus } from '../entities/conversation-thread.entity';
import { Message } from '../entities/message.entity';
import { Channel } from '../enums/channel.enum';
import { MessagingEngineService } from './messaging-engine.service';

@Injectable()
export class InboxService {
    constructor(
        @InjectRepository(ConversationThread)
        private readonly threadRepo: Repository<ConversationThread>,
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
        @Inject(forwardRef(() => MessagingEngineService))
        private readonly messagingEngine: MessagingEngineService,
    ) { }

    async getThreads(businessId: string, channel: Channel): Promise<ConversationThread[]> {
        return this.threadRepo.find({
            where: { businessId, channel },
            relations: ['contact'],
            order: { lastActivityAt: 'DESC' },
        });
    }

    async getThreadMessages(businessId: string, threadId: string): Promise<Message[]> {
        const thread = await this.threadRepo.findOne({ where: { id: threadId, businessId } });
        if (!thread) {
            throw new NotFoundException('Thread not found');
        }

        return this.messageRepo.find({
            where: { threadId },
            order: { timestamp: 'ASC' },
        });
    }

    async sendReply(businessId: string, threadId: string, content: string): Promise<Message | null> {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId, businessId },
            relations: ['contact'],
        });

        if (!thread) {
            throw new NotFoundException('Thread not found');
        }

        // Call engine to handle actual send, credits, logging, socket emit etc.
        const messageId = await this.messagingEngine.sendReply(thread, content);
        if (!messageId) {
            return null;
        }

        // Update thread activity
        thread.lastActivityAt = new Date();
        thread.status = ThreadStatus.OPEN;
        await this.threadRepo.save(thread);

        return this.messageRepo.findOne({ where: { id: messageId } });
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
