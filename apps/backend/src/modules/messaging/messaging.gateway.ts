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
import { Message } from './entities/message.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { MessageDirection, MessageStatus } from './enums/message.enum';

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
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
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

      // If they belong to a branch, join branch room
      if (user.branchId) {
        client.join(`branch_${user.branchId}`);
      }

      this.logger.log(`Client connected: ${user.id} (${user.role})`);

      // Update last active
      await this.userRepo.update(user.id, { lastActive: new Date() });
    } catch (e) {
      this.logger.error(`Connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
    this.server.to(`thread_${threadId}`).emit('messageUpdate', update);

    // Update staff inbox (for last message snippet if it was edited)
    this.server.to(`branch_${branchId}`).emit('inboxUpdate', {
      type: 'message_update',
      threadId,
      update,
    });
  }
}
