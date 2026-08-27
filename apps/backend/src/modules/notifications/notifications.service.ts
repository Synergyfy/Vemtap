import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
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
import {
  AdminBroadcastDto,
  BroadcastQueryDto,
} from './dto/admin-broadcast.dto';

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
    @Inject(forwardRef(() => PushNotificationService))
    private pushNotificationService: PushNotificationService,
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
      await this.notificationsRepository.save(notifications, { chunk: 500 });
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

  async broadcastToRole(
    role: UserRole,
    title: string,
    message: string,
    type: string = 'broadcast',
  ) {
    const users = await this.userRepository.find({ where: { role } });
    const notifications = users.map((user) =>
      this.notificationsRepository.create({
        userId: user.id,
        title,
        message,
        type,
      }),
    );
    return this.notificationsRepository.save(notifications);
  }

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
    return this.notificationsRepository.save(notification);
  }

  async findByUser(userId: string) {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
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
