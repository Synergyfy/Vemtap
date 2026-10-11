import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  NotificationBroadcast,
  TargetAudience,
  BroadcastStatus,
} from './entities/notification-broadcast.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { PushNotificationService } from './push-notification.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  AdminBroadcastDto,
  BroadcastQueryDto,
} from './dto/admin-broadcast.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(NotificationBroadcast)
    private broadcastRepository: Repository<NotificationBroadcast>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private pushNotificationService: PushNotificationService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getPreferences(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'notificationPreferences'],
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      push: true,
      email: true,
      sms: true,
      marketing: true,
      orderUpdates: true,
      loyalty: true,
      support: true,
      rewardAlerts: true,
      activityDigest: true,
      smsSecurity: false,
      ...(user.notificationPreferences || {}),
    };
  }

  async updatePreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ) {
    const updated = { ...(await this.getPreferences(userId)), ...preferences };
    await this.userRepository.update(userId, {
      notificationPreferences: updated,
    });
    return updated;
  }

  /**
   * Helper to resolve target user roles from targetAudience.
   */
  private resolveRolesForAudience(audience: TargetAudience): UserRole[] {
    switch (audience) {
      case TargetAudience.BUSINESSES:
        return [UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF];
      case TargetAudience.CUSTOMERS:
        return [UserRole.CUSTOMER, UserRole.USER];
      case TargetAudience.AGENTS:
        return [UserRole.AGENT];
      case TargetAudience.ALL:
      default:
        return [
          UserRole.OWNER,
          UserRole.MANAGER,
          UserRole.STAFF,
          UserRole.CUSTOMER,
          UserRole.USER,
          UserRole.AGENT,
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN,
        ];
    }
  }

  /**
   * Admin broadcast: Dispatches push and in-app notifications to targeted audience.
   */
  async sendAdminBroadcast(senderId: string, dto: AdminBroadcastDto) {
    const roles = this.resolveRolesForAudience(dto.targetAudience);
    const users = await this.userRepository.find({
      where: {
        role: In(roles),
        status: In([UserStatus.ACTIVE, UserStatus.INVITED, UserStatus.PENDING]),
      },
      select: ['id', 'role', 'pushToken', 'notificationPreferences'],
    });

    const sendInApp = dto.sendInApp !== false;
    const sendPush = dto.sendPush !== false;
    let pushRecipients = 0;

    // 1. Create In-App Notifications
    if (sendInApp && users.length > 0) {
      const notifications = users.map((user) =>
        this.notificationsRepository.create({
          userId: user.id,
          title: dto.title,
          message: dto.message,
          type: dto.type || 'announcement',
          actionUrl: dto.actionUrl ?? null,
          isRead: false,
        }),
      );
      const saved = await this.notificationsRepository.save(notifications, {
        chunk: 500,
      });

      // A broadcast can target thousands of users; one batched emit reaches
      // all of them without a socket message per row.
      this.notificationsGateway.emitBroadcastCreated(
        saved.map((n) => n.userId),
        saved.length,
      );
    }

    // 2. Dispatch Web Push Notifications
    if (sendPush) {
      const usersWithPushToken = users.filter((u) => Boolean(u.pushToken));
      pushRecipients = usersWithPushToken.length;

      // Queue push notifications asynchronously
      for (const user of usersWithPushToken) {
        try {
          await this.pushNotificationService.sendNotification(
            user.id,
            dto.title,
            dto.message,
            {
              url: dto.actionUrl,
              type: dto.type || 'announcement',
              category: 'marketing',
              broadcast: true,
            },
            true,
          );
        } catch (err: any) {
          this.logger.warn(
            `Failed to queue push notification for user ${user.id}: ${err.message}`,
          );
        }
      }
    }

    // 3. Persist Broadcast record
    const channels: string[] = [];
    if (sendInApp) channels.push('IN_APP');
    if (sendPush) channels.push('PUSH');

    const broadcast = this.broadcastRepository.create({
      senderId: senderId ?? null,
      title: dto.title,
      message: dto.message,
      targetAudience: dto.targetAudience,
      type: dto.type || 'announcement',
      actionUrl: dto.actionUrl ?? null,
      channels,
      totalRecipients: users.length,
      pushRecipients,
      status: BroadcastStatus.SENT,
    });

    const savedBroadcast = await this.broadcastRepository.save(broadcast);
    this.logger.log(
      `Broadcast sent by ${senderId} to ${dto.targetAudience} (${users.length} in-app, ${pushRecipients} push)`,
    );

    return savedBroadcast;
  }

  /**
   * Writes one in-app notification and tells the recipient's sockets.
   *
   * The emit is the point of this service being the only writer of the table:
   * a row can appear through the bell refetching, but a live client sees it
   * the moment it lands.
   */
  async create(
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
    actionUrl?: string | null,
  ) {
    const notification = this.notificationsRepository.create({
      userId,
      title,
      message,
      type,
      actionUrl: actionUrl ?? null,
    });
    const saved = await this.notificationsRepository.save(notification);
    this.notificationsGateway.emitNotificationCreated(userId, saved);
    return saved;
  }

  /**
   * Writes one notification per recipient.
   *
   * Used for staff alerts, which target a whole branch's worth of users at
   * once. Saved in one statement so a fan-out of N recipients is one round
   * trip, and emitted as a single batch rather than N socket messages.
   */
  async createMany(
    userIds: string[],
    title: string,
    message: string,
    type: string = 'info',
    actionUrl?: string | null,
  ) {
    const unique = [...new Set(userIds)].filter(Boolean);
    if (unique.length === 0) return [];

    const rows = unique.map((userId) =>
      this.notificationsRepository.create({
        userId,
        title,
        message,
        type,
        actionUrl: actionUrl ?? null,
      }),
    );

    const saved = await this.notificationsRepository.save(rows, {
      chunk: 200,
    });
    this.notificationsGateway.emitBroadcastCreated(unique, saved.length);
    return saved;
  }

  /**
   * Writes one notification per staff member of a branch.
   *
   * Staff covers both a direct `branchId` and everyone attached to the
   * business — owners and managers often hold no `branchId` of their own, and
   * they are the people most likely to be watching for an order.
   */
  async createForBranchStaff(
    branchId: string,
    businessId: string | null | undefined,
    title: string,
    message: string,
    type: string = 'info',
    actionUrl?: string | null,
  ) {
    const staff = await this.userRepository.find({
      where: [{ branchId }, ...(businessId ? [{ businessId }] : [])],
      select: ['id'],
    });

    return this.createMany(
      staff.map((s) => s.id),
      title,
      message,
      type,
      actionUrl,
    );
  }

  /**
   * Lists a user's notifications, newest first, with a cursor on createdAt.
   *
   * The list is paginated: the bell and the inbox both fetch it on every focus
   * or socket event, and an unbounded fetch turns a long-lived account's inbox
   * into a growing payload. `limit` defaults to 50 (matching the UI's page
   * size) and is capped at 200, and `before` takes the `createdAt` of the last
   * row to continue from.
   */
  async findByUser(
    userId: string,
    options: { limit?: number; before?: Date } = {},
  ) {
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 200;

    const take = Math.min(
      Math.max(1, Number(options.limit) || DEFAULT_LIMIT),
      MAX_LIMIT,
    );

    const qb = this.notificationsRepository
      .createQueryBuilder('n')
      .where('n."userId" = :userId', { userId })
      .orderBy('n."createdAt"', 'DESC')
      .take(take + 1);

    if (options.before && !Number.isNaN(options.before.getTime())) {
      qb.andWhere('n."createdAt" < :before', { before: options.before });
    }

    const rows = await qb.getMany();
    return rows;
  }

  async markAsRead(id: string, userId: string) {
    // Scoped by userId: without it any authenticated user could mark any
    // other user's notifications read by guessing ids.
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    if (notification.isRead) return notification;
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    this.notificationsGateway.emitNotificationsReadAll(userId, 0);
  }

  async getUnreadCount(userId: string) {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Returns paginated broadcast history from notification_broadcasts table.
   */
  async getBroadcastHistory(query: BroadcastQueryDto = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.broadcastRepository
      .createQueryBuilder('broadcast')
      .leftJoinAndSelect('broadcast.sender', 'sender')
      .orderBy('broadcast.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.targetAudience) {
      qb.andWhere('broadcast.targetAudience = :audience', {
        audience: query.targetAudience,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(broadcast.title ILIKE :search OR broadcast.message ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBroadcastById(id: string) {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id },
      relations: ['sender'],
    });
    if (!broadcast) {
      throw new NotFoundException(`Broadcast with id ${id} not found`);
    }
    return broadcast;
  }
}
