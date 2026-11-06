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
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Channel } from './enums/channel.enum';
import { Branch } from '../branches/entities/branch.entity';
import { Message } from './entities/message.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { MessageDirection, MessageStatus } from './enums/message.enum';
import {
  PresenceService,
  type PresenceKind,
} from './services/presence.service';

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

  afterInit(_server: Server) {
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
      const userStatus = this.presenceService.setOnline(
        'user',
        user.id,
        client.id,
      );
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

      // Second tick for everything that arrived while this user was away.
      await this.deliverPendingFor(client).catch((e) =>
        this.logger.error(`deliverPending error: ${e.message}`),
      );
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
  handlePresenceGet(
    @MessageBody() data: { userIds?: string[]; businessIds?: string[] },
  ) {
    return Promise.resolve(
      this.presenceSnapshot(
        this.cleanIds(data?.userIds),
        this.cleanIds(data?.businessIds),
      ),
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
   * Which side of a thread this socket reads as, or null when it is not a
   * party to it. Decided by ownership rather than role: an owner who switches
   * to the customer shell keeps their owner role but is the customer on their
   * own threads, and a role check would ack the wrong direction for them.
   *
   * Returns the direction of the messages addressed to this socket — the ones
   * it is allowed to mark delivered or read.
   */
  private async incomingDirectionFor(
    client: Socket,
    threadId: string,
  ): Promise<{
    thread: ConversationThread;
    direction: MessageDirection;
  } | null> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
      select: ['id', 'branchId', 'customerId'],
    });
    if (!thread) return null;
    if (thread.customerId && thread.customerId === client.data.userId) {
      return { thread, direction: MessageDirection.OUTBOUND };
    }
    const branchIds: string[] = client.data.branchIds ?? [];
    if (thread.branchId && branchIds.includes(thread.branchId)) {
      return { thread, direction: MessageDirection.INBOUND };
    }
    return null;
  }

  /**
   * Tell the sender that their messages moved on. The thread room only reaches
   * someone with the conversation open, so the sender's own rooms are added:
   * staff hear about OUTBOUND receipts on the branch room, the customer hears
   * about INBOUND receipts on their user room. Clients apply receipts
   * idempotently, so a socket in both rooms getting it twice is harmless.
   */
  emitReceipt(
    thread: { id: string; branchId: string; customerId: string },
    direction: MessageDirection,
    messageIds: string[],
    status: MessageStatus.DELIVERED | MessageStatus.READ,
  ): void {
    if (messageIds.length === 0) return;
    const senderRoom =
      direction === MessageDirection.OUTBOUND
        ? `branch_${thread.branchId}`
        : `user_${thread.customerId}`;
    const event =
      status === MessageStatus.READ ? 'messageRead' : 'messageStatus';
    this.server.to([`thread_${thread.id}`, senderRoom]).emit(event, {
      threadId: thread.id,
      // `messageId` is kept for clients that only read a single id.
      messageId: messageIds[0],
      messageIds,
      status,
    });
  }

  /**
   * Delivery receipt: the recipient's client acks that a message reached the
   * device. Only SENT messages addressed to this socket move to DELIVERED, so
   * a sender can never tick their own message and a READ one never regresses.
   */
  @SubscribeMessage('markDelivered')
  async handleMarkDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId?: string; messageIds?: string[]; threadId: string },
  ) {
    const threadId = data?.threadId;
    const requested = this.cleanIds([
      ...(data?.messageIds ?? []),
      ...(data?.messageId ? [data.messageId] : []),
    ]);
    if (!threadId || requested.length === 0) return;
    try {
      const side = await this.incomingDirectionFor(client, threadId);
      if (!side) return;

      const messages = await this.messageRepo.find({
        where: {
          id: In(requested),
          threadId,
          direction: side.direction,
          status: MessageStatus.SENT,
        },
        select: ['id'],
      });
      const ids = messages.map((m) => m.id);
      if (ids.length === 0) return;

      await this.messageRepo.update(
        { id: In(ids) },
        { status: MessageStatus.DELIVERED },
      );
      this.emitReceipt(
        side.thread,
        side.direction,
        ids,
        MessageStatus.DELIVERED,
      );
    } catch (e) {
      this.logger.error(`markDelivered error: ${e.message}`);
    }
  }

  /**
   * Read receipt: the recipient opened the conversation, so messages sent to
   * them in the thread move SENT|DELIVERED -> READ and the sender is told.
   */
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; messageIds?: string[] },
  ) {
    const threadId = data?.threadId;
    if (!threadId) return;
    try {
      const side = await this.incomingDirectionFor(client, threadId);
      if (!side) return;
      await this.markThreadRead(side.thread, side.direction, data?.messageIds);
    } catch (e) {
      this.logger.error(`markRead error: ${e.message}`);
    }
  }

  /**
   * Advance the messages addressed to one side of a thread to READ and notify
   * the sender. Shared by the socket event and the REST "mark thread read"
   * endpoints, so opening a chat turns the ticks blue even when the reader's
   * socket was not connected at that moment.
   */
  async markThreadRead(
    thread: { id: string; branchId: string; customerId: string },
    direction: MessageDirection,
    messageIds?: string[],
  ): Promise<void> {
    const where: Record<string, unknown> = {
      threadId: thread.id,
      direction,
      status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
    };
    if (messageIds?.length) where.id = In(messageIds);

    const messages = await this.messageRepo.find({ where, select: ['id'] });
    const ids = messages.map((m) => m.id);
    if (ids.length === 0) return;

    await this.messageRepo.update(
      { id: In(ids) },
      { status: MessageStatus.READ },
    );
    this.emitReceipt(thread, direction, ids, MessageStatus.READ);
  }

  /**
   * A recipient coming online has received everything still waiting for them,
   * which is the moment WhatsApp shows the second tick. Covers both sides the
   * socket can be on: the customer of its own threads and staff of its
   * branches.
   */
  private async deliverPendingFor(client: Socket): Promise<void> {
    const userId: string | undefined = client.data.userId;
    const branchIds: string[] = client.data.branchIds ?? [];
    const conditions: Record<string, unknown>[] = [];
    if (userId) {
      conditions.push({
        customerId: userId,
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.SENT,
        channel: Channel.IN_HOUSE,
      });
    }
    if (branchIds.length > 0) {
      conditions.push({
        branchId: In(branchIds),
        direction: MessageDirection.INBOUND,
        status: MessageStatus.SENT,
        channel: Channel.IN_HOUSE,
      });
    }
    if (conditions.length === 0) return;

    const pending = await this.messageRepo.find({
      where: conditions,
      select: ['id', 'threadId', 'branchId', 'customerId', 'direction'],
    });
    if (pending.length === 0) return;

    await this.messageRepo.update(
      { id: In(pending.map((m) => m.id)) },
      { status: MessageStatus.DELIVERED },
    );

    const groups = new Map<
      string,
      {
        thread: { id: string; branchId: string; customerId: string };
        direction: MessageDirection;
        ids: string[];
      }
    >();
    for (const message of pending) {
      if (!message.threadId) continue;
      const key = `${message.threadId}:${message.direction}`;
      const group = groups.get(key) ?? {
        thread: {
          id: message.threadId,
          branchId: message.branchId,
          customerId: message.customerId,
        },
        direction: message.direction,
        ids: [],
      };
      group.ids.push(message.id);
      groups.set(key, group);
    }
    for (const group of groups.values()) {
      this.emitReceipt(
        group.thread,
        group.direction,
        group.ids,
        MessageStatus.DELIVERED,
      );
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
