import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Message } from './entities/message.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { MessageDirection, MessageStatus } from './enums/message.enum';
import { PresenceService, type PresenceKind } from './services/presence.service';

/** Room a subscriber joins to hear about one presence channel. */
function presenceRoom(kind: PresenceKind, id: string): string {
  return `presence:${kind}:${id}`;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'messaging',
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('MessagingGateway');

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
    private readonly presenceService: PresenceService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        this.logger.debug('No token provided, disconnecting client');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });

      if (!user) {
        this.logger.debug(
          `User not found for sub: ${payload.sub}, disconnecting`,
        );
        client.disconnect();
        return;
      }

      // Store user info in socket
      client.data.userId = user.id;
      client.data.role = user.role;

      // Join personal room for targeted events (like notifications)
      client.join(`user_${user.id}`);

      // Join every branch the user can see, not just the one on their row.
      // An owner or manager often holds no `branchId` of their own — it is
      // null for anyone who heads the business rather than a single branch —
      // so widening by `businessId` is what stops them missing every
      // branch-scoped message event.
      const branchIds = new Set<string>();
      if (user.branchId) {
        branchIds.add(user.branchId);
      }
      if (user.businessId) {
        const businessBranches = await this.branchRepo.find({
          where: { businessId: user.businessId },
          select: ['id'],
        });
        for (const branch of businessBranches) {
          branchIds.add(branch.id);
        }
      }
      for (const branchId of branchIds) {
        client.join(`branch_${branchId}`);
      }
      if (branchIds.size > 0) {
        client.data.branchIds = [...branchIds];
      }

      // Presence: the customer-facing channel is the business, not the staff
      // member — a thread knows the business, never which staffer is holding
      // the phone — so both keys are tracked and announced.
      const userStatus = this.presenceService.setOnline('user', user.id, client.id);
      this.emitPresence('user', user.id, userStatus);
      if (user.businessId) {
        client.data.businessId = user.businessId;
        const businessStatus = this.presenceService.setOnline(
          'business',
          user.businessId,
          client.id,
        );
        this.emitPresence('business', user.businessId, businessStatus);
      }

      await this.userRepo.update(user.id, {
        isOnline: true,
        lastSeen: new Date(),
      });

      this.logger.log(
        `Client connected: ${user.id} (${user.role})` +
          (branchIds.size > 0
            ? ` — joined ${branchIds.size} branch room(s)`
            : ''),
      );

      // Update last active
      await this.userRepo.update(user.id, { lastActive: new Date() });
    } catch (e) {
      this.logger.error(`Connection error: ${e.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const status = this.presenceService.setOffline('user', userId, client.id);
      this.emitPresence('user', userId, status);
      // One of several sockets of the same user may still be connected, so the
      // durable column follows the computed status rather than assuming the
      // user is gone.
      await this.userRepo.update(userId, {
        isOnline: status.isOnline,
        lastSeen: new Date(),
      });
    }

    const businessId = client.data.businessId;
    if (businessId) {
      const status = this.presenceService.setOffline(
        'business',
        businessId,
        client.id,
      );
      this.emitPresence('business', businessId, status);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Announce a presence change to whoever subscribed to this channel. Only
   * subscribers care, so it goes to the channel's room rather than every
   * socket on the server.
   */
  private emitPresence(
    kind: PresenceKind,
    id: string,
    status: { isOnline: boolean; lastSeen: string | null },
  ): void {
    this.server
      .to(presenceRoom(kind, id))
      .emit('presence:update', { kind, id, ...status });
  }

  @SubscribeMessage('joinThread')
  handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    this.logger.debug(
      `User ${client.data.userId} joining thread ${data.threadId}`,
    );
    client.join(`thread_${data.threadId}`);
    return { status: 'joined', threadId: data.threadId };
  }

  @SubscribeMessage('leaveThread')
  handleLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    this.logger.debug(
      `User ${client.data.userId} leaving thread ${data.threadId}`,
    );
    client.leave(`thread_${data.threadId}`);
    return { status: 'left', threadId: data.threadId };
  }

  /**
   * Snapshot + live updates for the channels a screen renders. Rooms are
   * joined *before* the snapshot is read so a connect landing in between is
   * delivered as an event and the snapshot cannot go stale on arrival.
   *
   * The ack is plain objects (not a `Map`) so it survives JSON, and covers
   * both kinds: `userIds` is how staff follow a customer, `businessIds` is how
   * a customer follows a business.
   */
  @SubscribeMessage('presence:subscribe')
  async handlePresenceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds?: string[]; businessIds?: string[] },
  ) {
    const userIds = this.cleanIds(data?.userIds);
    const businessIds = this.cleanIds(data?.businessIds);
    for (const id of userIds) await client.join(presenceRoom('user', id));
    for (const id of businessIds)
      await client.join(presenceRoom('business', id));
    return this.presenceSnapshot(userIds, businessIds);
  }

  @SubscribeMessage('presence:unsubscribe')
  async handlePresenceUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds?: string[]; businessIds?: string[] },
  ) {
    for (const id of this.cleanIds(data?.userIds)) {
      await client.leave(presenceRoom('user', id));
    }
    for (const id of this.cleanIds(data?.businessIds)) {
      await client.leave(presenceRoom('business', id));
    }
    return { ok: true };
  }

  /** Read-only snapshot; does not join any room. */
  @SubscribeMessage('presence:get')
  async handlePresenceGet(
    @MessageBody() data: { userIds?: string[]; businessIds?: string[] },
  ) {
    return this.presenceSnapshot(
      this.cleanIds(data?.userIds),
      this.cleanIds(data?.businessIds),
    );
  }

  private cleanIds(ids: string[] | undefined): string[] {
    return [...new Set((ids ?? []).filter((id): id is string => !!id))];
  }

  private presenceSnapshot(userIds: string[], businessIds: string[]) {
    return {
      users: this.presenceService.getStatuses('user', userIds),
      businesses: this.presenceService.getStatuses('business', businessIds),
    };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    // Broadcast to others in the thread
    client.to(`thread_${data.threadId}`).emit('userTyping', {
      userId,
      threadId: data.threadId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Receipt handling: recipient's client acks that it received the message.
   * Moves a message SENT -> DELIVERED and tells the sender.
   */
  @SubscribeMessage('markDelivered')
  async handleMarkDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; threadId: string },
  ) {
    const { messageId, threadId } = data || {};
    if (!messageId) return;
    try {
      const message = await this.messageRepo.findOneBy({ id: messageId });
      if (!message || message.status === MessageStatus.READ) return;
      if (message.status !== MessageStatus.DELIVERED) {
        message.status = MessageStatus.DELIVERED;
        await this.messageRepo.save(message);
      }
      this.server.to(`thread_${threadId}`).emit('messageStatus', {
        threadId,
        messageId,
        status: MessageStatus.DELIVERED,
      });
    } catch (e) {
      this.logger.error(`markDelivered error: ${e.message}`);
    }
  }

  /**
   * Read receipt: recipient opened the conversation, so all messages sent
   * to them in the thread move DELIVERED -> READ and the sender is told.
   */
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; messageIds?: string[] },
  ) {
    const threadId = data?.threadId;
    if (!threadId) return;
    const userId = client.data.userId;
    const role = client.data.role;
    try {
      // The "other side" messages are the ones we read. A customer reads
      // OUTBOUND (business -> customer); staff read INBOUND (customer -> business).
      const readDirection =
        role === UserRole.CUSTOMER
          ? MessageDirection.OUTBOUND
          : MessageDirection.INBOUND;

      const where: any = {
        threadId,
        direction: readDirection,
        status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
      };
      if (data?.messageIds?.length) where.id = In(data.messageIds);

      const messages = await this.messageRepo.find({ where });
      if (messages.length === 0) return;

      const ids = messages.map((m) => m.id);
      await this.messageRepo.update(
        { id: In(ids) },
        { status: MessageStatus.READ },
      );

      this.server.to(`thread_${threadId}`).emit('messageRead', {
        threadId,
        messageIds: ids,
        status: MessageStatus.READ,
      });
      void userId;
    } catch (e) {
      this.logger.error(`markRead error: ${e.message}`);
    }
  }

  /**
   * Helper to emit message to relevant rooms
   */
  emitMessage(
    threadId: string,
    branchId: string,
    customerId: string,
    message: any,
  ) {
    // 1. Emit to specific thread (for anyone currently looking at it)
    this.server.to(`thread_${threadId}`).emit('newMessage', message);

    // 2. Emit to branch room (for staff inbox list updates)
    this.server.to(`branch_${branchId}`).emit('inboxUpdate', {
      type: 'new_message',
      threadId,
      message,
    });

    // 3. Emit a general notification to the specific recipient
    const isOutbound =
      message.direction === 'outbound' || message.direction === 'OUTBOUND';

    if (isOutbound) {
      // Notify the customer
      this.server.to(`user_${customerId}`).emit('notification', {
        type: 'new_message',
        title: 'New Message',
        body:
          message.content.substring(0, 50) +
          (message.content.length > 50 ? '...' : ''),
        threadId,
        message,
      });
    } else {
      // Notify staff in the branch
      this.server.to(`branch_${branchId}`).emit('notification', {
        type: 'new_message',
        title: 'New Message from Customer',
        body:
          message.content.substring(0, 50) +
          (message.content.length > 50 ? '...' : ''),
        threadId,
        message,
      });
    }
  }

  /**
   * Broadcast message updates (edit/delete)
   */
  emitMessageUpdate(
    threadId: string,
    branchId: string,
    customerId: string,
    update: any,
  ) {
    // Notify anyone looking at the thread
    this.server.to(`thread_${threadId}`).emit('messageUpdate', {
      ...update,
      threadId,
    });

    // Update staff inbox (for last message snippet if it was edited)
    this.server.to(`branch_${branchId}`).emit('inboxUpdate', {
      type: 'message_update',
      threadId,
      update,
    });
  }

  /**
   * Broadcast that a conversation thread was deleted
   */
  emitThreadDeleted(threadId: string, branchId: string, customerId: string) {
    // Notify anyone currently viewing the conversation
    this.server.to(`thread_${threadId}`).emit('threadDeleted', { threadId });

    // Update staff inbox lists
    this.server.to(`branch_${branchId}`).emit('inboxUpdate', {
      type: 'thread_deleted',
      threadId,
    });

    // Notify the customer's other devices
    this.server.to(`user_${customerId}`).emit('threadDeleted', { threadId });
  }
}
