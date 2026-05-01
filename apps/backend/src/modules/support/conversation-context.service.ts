import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { BotConversationContext } from './entities/conversation-context.entity';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  messageId?: string;
}

@Injectable()
export class ConversationContextService {
  private readonly logger = new Logger(ConversationContextService.name);
  private readonly CONTEXT_EXPIRY_HOURS = 24;
  private readonly MAX_MESSAGES = 20;

  constructor(
    @InjectRepository(BotConversationContext)
    private readonly contextRepo: Repository<BotConversationContext>,
  ) {}

  async getContext(
    userId: string | null,
    sessionId?: string | null,
  ): Promise<BotConversationContext | null> {
    const query: any = { userId: userId || IsNull(), isActive: true };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    return this.contextRepo.findOne({
      where: query,
      order: { lastActivity: 'DESC' },
    });
  }

  async getOrCreateContext(
    userId: string | null,
    sessionId?: string | null,
  ): Promise<BotConversationContext> {
    let context = await this.getContext(userId, sessionId);

    if (!context) {
      context = this.contextRepo.create({
        userId,
        sessionId: sessionId || this.generateSessionId(),
        messages: [],
        currentPath: null,
        userResponses: {},
        lastActivity: new Date(),
        isActive: true,
      });
      context = await this.contextRepo.save(context);
    }

    return context;
  }

  async addMessage(
    userId: string | null,
    sessionId: string | null,
    role: 'user' | 'bot',
    content: string,
    messageId?: string,
  ): Promise<BotConversationContext> {
    const context = await this.getOrCreateContext(userId, sessionId);

    const message: ChatMessage = {
      role,
      content,
      timestamp: new Date(),
      messageId,
    };

    context.messages.push(message);

    if (context.messages.length > this.MAX_MESSAGES) {
      context.messages = context.messages.slice(-this.MAX_MESSAGES);
    }

    context.lastActivity = new Date();

    return this.contextRepo.save(context);
  }

  async addUserResponse(
    userId: string | null,
    sessionId: string | null,
    key: string,
    value: any,
  ): Promise<BotConversationContext> {
    const context = await this.getOrCreateContext(userId, sessionId);

    context.userResponses = context.userResponses || {};
    context.userResponses[key] = value;
    context.lastActivity = new Date();

    return this.contextRepo.save(context);
  }

  async setPath(
    userId: string | null,
    sessionId: string | null,
    path: string,
  ): Promise<BotConversationContext> {
    const context = await this.getOrCreateContext(userId, sessionId);
    context.currentPath = path;
    context.lastActivity = new Date();
    return this.contextRepo.save(context);
  }

  async getRecentMessages(
    userId: string | null,
    sessionId: string | null,
    limit: number = 10,
  ): Promise<ChatMessage[]> {
    const context = await this.getContext(userId, sessionId);
    if (!context || !context.messages) return [];
    return context.messages.slice(-limit);
  }

  async clearContext(
    userId: string | null,
    sessionId?: string | null,
  ): Promise<void> {
    const query: any = { userId: userId || IsNull(), isActive: true };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    await this.contextRepo.update(query, { isActive: false });
  }

  async cleanupExpiredContexts(): Promise<number> {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() - this.CONTEXT_EXPIRY_HOURS);

    const result = await this.contextRepo.update(
      {
        lastActivity: LessThan(expiryDate),
        isActive: true,
      },
      { isActive: false },
    );

    return result.affected || 0;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
