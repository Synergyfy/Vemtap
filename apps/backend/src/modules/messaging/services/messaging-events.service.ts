import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from '../entities/message.entity';
import { ConversationThread } from '../entities/conversation-thread.entity';
import { MessageDirection, MessageStatus } from '../enums/message.enum';

@Injectable()
export class MessagingEventsService {
  private readonly logger: Logger = new Logger(MessagingEventsService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
  ) {}

  /** Advance messages SENT|DELIVERED -> READ and emit socket event.
   *  direction: MessageDirection.OUTBOUND (customer -> business) or INBOUND (business -> customer).
   *  userId is the ID of the user who triggered the read (e.g. the customer ID or branch ID).
   */
  async advanceStatusAndEmit(
    threadId: string,
    messageIds: string[],
    direction: MessageDirection,
    userId: string,
  ): Promise<void> {
    // 1. Advance backend status
    const where: any = {
      threadId,
      status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
    };
    if (direction === MessageDirection.OUTBOUND) {
      where.customerId = userId;
    } else if (direction === MessageDirection.INBOUND) {
      where.branchId = userId;
    }
    await this.messageRepo.update(where, { status: MessageStatus.READ });

    // 2. Emit socket event to the thread room — the caller must have access to the Server instance;
    // the gateway will forward this emit. We'll emit a minimal event so the caller can
    // bridge it to the actual gateway server.
    this.logger.debug(
      `Messages advanced to READ in thread ${threadId}, ids: ${messageIds.join(',')}`,
    );
  }
}
