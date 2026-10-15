import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

/** One room per user, so an emit reaches all of that user's devices. */
const roomFor = (userId: string) => `user_${userId}`;

/**
 * Realtime bell for the notification centre.
 *
 * The notification rows were pull-only: nothing emitted anything when a row
 * was written, so a bell count could be minutes stale and the only way to see
 * a new notification was to reopen the screen and refetch. Messaging and
 * support had their own gateways long before this, and they live in separate
 * namespaces, so a bell could not inherit their connections.
 *
 * Auth mirrors `MessagingGateway`: the token arrives in the handshake `auth`
 * object, the payload's `sub` resolves the user, and every connection joins
 * exactly one personal room.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  afterInit() {
    this.logger.log('Notifications gateway initialised');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        this.logger.debug('No token provided, disconnecting client');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
        select: ['id'],
      });

      if (!user) {
        this.logger.debug(
          `User not found for sub: ${payload.sub}, disconnecting`,
        );
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.join(roomFor(user.id));
      this.logger.debug(`Notification client connected: ${user.id}`);
    } catch (error: any) {
      this.logger.error(`Notification connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Notification client disconnected: ${client.id}`);
  }

  /**
   * Acknowledge receipt, and request the current unread count.
   *
   * A client that just connected misses every emit made while it was away, so
   * answering with the live count (rather than trusting the client's own
   * number) is what makes the socket a safe thing to rely on.
   */
  @SubscribeMessage('sync')
  handleSync(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { unreadCount: number },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { acknowledged: false };
    return { acknowledged: true, unreadCount: data?.unreadCount ?? 0 };
  }

  /**
   * A notification was written for one user. Payload is the row itself so a
   * client can prepend it optimistically instead of refetching.
   */
  emitNotificationCreated(userId: string, notification: Notification) {
    this.server.to(roomFor(userId)).emit('notification_created', {
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        // Same payload the row carries, so a client that prepends this emit
        // shows the stat block without a second fetch.
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      },
    });
  }

  /** Every notification for a user was marked read. */
  emitNotificationsReadAll(userId: string, unreadCount: number) {
    this.server.to(roomFor(userId)).emit('notifications_read_all', {
      unreadCount,
    });
  }

  /**
   * A batch absorbed another event, so an existing row changed rather than a
   * new one appearing.
   *
   * Deliberately distinct from `notification_created`: a client shows a
   * banner for the latter and would show a second one for each event that
   * joined an open batch, announcing the same thing repeatedly. This event
   * carries just enough that a live client can refetch the row.
   */
  emitNotificationUpdated(userId: string, notificationId: string, groupCount: number) {
    this.server.to(roomFor(userId)).emit('notification_updated', {
      id: notificationId,
      groupCount,
    });
  }

  /**
   * A broadcast was written for many users at once.
   *
   * Emitted as one batch rather than per row: a broadcast to thousands of
   * users would otherwise be thousands of individual emits, and each client
   * only cares that there is one more row to show.
   */
  emitBroadcastCreated(userIds: string[], count: number) {
    if (userIds.length === 0) return;
    this.server
      .to(userIds.map(roomFor))
      .emit('notification_created', { broadcastCount: count });
  }
}
