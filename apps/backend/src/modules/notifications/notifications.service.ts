import {
  Injectable,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { InjectQueue } from '@nestjs/bullmq';
import { buildBatchKey, closeJobId, getBatchPolicy } from './batching.policy';
import { buildAggregateCopy } from './batching.copy';

/** Where a closer is queued. Injected so tests can decide to not schedule. */
export const NOTIFICATION_BATCH_QUEUE = 'notification-batch-close';

/** How many actor names a batch row keeps before it just counts the rest. */
const ACTORS_STORED_MAX = 5;

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
    @Optional()
    @InjectQueue(NOTIFICATION_BATCH_QUEUE)
    private readonly batchQueue?: {
      add: (
        name: string,
        data: unknown,
        opts: Record<string, unknown>,
      ) => Promise<unknown>;
    },
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
    // The validated DTO carries every optional key, unset ones as undefined;
    // spreading those would wipe the stored choices, so keep only real values.
    const changes = Object.fromEntries(
      Object.entries(preferences).filter(
        ([, value]) => typeof value === 'boolean',
      ),
    );
    const updated = { ...(await this.getPreferences(userId)), ...changes };
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
          // Stamped for consistency with every other writer, but never
          // batched: an admin broadcast is one deliberate message to many
          // people, not a repeated event to one person.
          eventType: 'announcement',
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
    metadata?: Record<string, any> | null,
    eventType?: string | null,
  ) {
    return this.writeOne({
      userId,
      title,
      message,
      type,
      actionUrl,
      metadata,
      eventType,
    });
  }

  /**
   * The single write path both `create` and `createMany` funnel through.
   *
   * For a batchable event an open batch is extended instead of writing a
   * second row — the count goes up, the actor is remembered, and `updatedAt`
   * moves so the row floats to the top of the feed. Everything else writes
   * exactly one row, unchanged from the pre-batching behaviour.
   */
  private async writeOne(input: {
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl?: string | null;
    metadata?: Record<string, any> | null;
    eventType?: string | null;
  }): Promise<Notification> {
    const { userId, title, message, type, actionUrl, metadata, eventType } =
      input;
    const batchKey = eventType
      ? buildBatchKey(userId, eventType, metadata)
      : null;

    if (batchKey) {
      const merged = await this.extendOpenBatch(
        userId,
        batchKey,
        eventType as string,
        metadata,
      );
      if (merged) return merged;
    }

    const notification = this.notificationsRepository.create({
      userId,
      title,
      message,
      type,
      actionUrl: actionUrl ?? null,
      metadata: metadata ?? null,
      eventType: eventType ?? null,
      batchKey,
      groupCount: 1,
    });
    const saved = await this.notificationsRepository.save(notification);

    if (batchKey) {
      // Schedule the closer. `jobId` is the batch key, so re-queueing for an
      // already-scheduled batch replaces nothing and adds nothing: one job
      // per batch, whichever event reached it first.
      await this.scheduleBatchClose(batchKey, eventType as string);
    }

    this.notificationsGateway.emitNotificationCreated(userId, saved);
    return saved;
  }

  /**
   * Adds an event to an open batch, if there is one.
   *
   * Returns null when no batch is open — the caller then writes a fresh row.
   * The window is enforced on read as well (`createdAt + windowMs`), so a
   * missed closer cannot extend a batch forever.
   */
  private async extendOpenBatch(
    userId: string,
    batchKey: string,
    eventType: string,
    metadata?: Record<string, any> | null,
  ): Promise<Notification | null> {
    const policy = getBatchPolicy(eventType);
    if (!policy) return null;

    const open = await this.notificationsRepository.findOne({
      where: { batchKey, flushedAt: undefined },
    });
    if (!open) return null;

    const existingActors = Array.isArray(open.metadata?.actors)
      ? (open.metadata.actors as unknown[])
      : [];
    const actors: Array<{ name: string }> = [
      ...(existingActors as Array<{ name: string }>),
    ];
    if (actors.length < ACTORS_STORED_MAX) {
      const name = this.actorNameFrom(metadata);
      if (name) actors.push({ name });
    }

    await this.notificationsRepository.update(open.id, {
      groupCount: open.groupCount + 1,
      // `updatedAt` is managed by TypeORM; setting it here is what floats
      // the row in a feed ordered on it.
      updatedAt: new Date(),
      metadata: { ...(open.metadata ?? {}), actors },
    });

    // A joined event is not a new row, so it is not announced as one. The
    // client needs to refetch to show the new count, but must not show a
    // second banner for an event whose first arrival already showed one.
    this.notificationsGateway.emitNotificationUpdated(
      userId,
      open.id,
      open.groupCount + 1,
    );

    return this.notificationsRepository.findOneBy({
      id: open.id,
    });
  }

  /** Pulls the actor's display name out of a writer's metadata. */
  private actorNameFrom(metadata?: Record<string, any> | null): string | null {
    const nested = metadata?.footnote;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
    return null;
  }

  /**
   * Queues the job that closes a batch. Best-effort: a failure here still
   * leaves a working batch (the read path expires it on its own), so it is
   * logged rather than thrown — an unthrowable error here would fail the
   * write that produced the notification the user is waiting on.
   */
  private async scheduleBatchClose(
    batchKey: string,
    eventType: string,
  ): Promise<void> {
    const policy = getBatchPolicy(eventType);
    if (!policy) return;
    try {
      await this.batchQueue?.add(
        'close',
        { batchKey },
        {
          jobId: closeJobId(batchKey),
          delay: policy.windowMs,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Could not schedule notification batch close for ${batchKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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
    metadata?: Record<string, any> | null,
    eventType?: string | null,
  ) {
    const unique = [...new Set(userIds)].filter(Boolean);
    if (unique.length === 0) return [];

    const saved: Notification[] = [];
    for (const userId of unique) {
      saved.push(
        await this.writeOne({
          userId,
          title,
          message,
          type,
          actionUrl,
          metadata,
          eventType,
        }),
      );
    }

    this.notificationsGateway.emitBroadcastCreated(unique, saved.length);
    return saved;
  }

  /**
   * Closes a batch, so the next event of that type starts a new row.
   *
   * Called by the delayed job, and safe to call twice: closing an already
   * closed batch is a no-op rather than an error, because a retried job and
   * the window's own expiry can both arrive for the same batch.
   */
  async closeBatch(batchKey: string): Promise<void> {
    const result = await this.notificationsRepository.update(
      { batchKey, flushedAt: undefined },
      { flushedAt: new Date() },
    );
    if (result.affected && result.affected > 0) {
      this.logger.debug(`Closed notification batch ${batchKey}`);
    }
  }

  /**
   * Closes every batch whose window has elapsed, and returns them.
   *
   * This is the safety net that makes the closer optional: if BullMQ never
   * ran the job (worker down, job lost), a batch would otherwise stay open
   * and keep absorbing events indefinitely. Called on read, so a stale batch
   * closes the moment anyone looks at the list rather than at the next
   * successful job.
   */
  private async expireOverdueBatches(): Promise<void> {
    const open = await this.notificationsRepository
      .createQueryBuilder('n')
      .select(['n.id', 'n.batchKey', 'n.eventType', 'n.createdAt'])
      .where('n."batchKey" IS NOT NULL')
      .andWhere('n."flushedAt" IS NULL')
      .limit(200)
      .getMany();

    const now = Date.now();
    const overdue = open.filter((row) => {
      const policy = getBatchPolicy(row.eventType);
      if (!policy || !row.createdAt) return false;
      return row.createdAt.getTime() + policy.windowMs < now;
    });

    for (const row of overdue) {
      await this.notificationsRepository.update(row.id, {
        flushedAt: new Date(),
      });
    }
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
    metadata?: Record<string, any> | null,
    eventType?: string | null,
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
      metadata,
      eventType,
    );
  }

  /**
   * Lists a user's notifications, newest first, with a cursor on updatedAt.
   *
   * The list is paginated: the bell and the inbox both fetch it on every focus
   * or socket event, and an unbounded fetch turns a long-lived account's inbox
   * into a growing payload. `limit` defaults to 50 (matching the UI's page
   * size) and is capped at 200, and `before` takes the `updatedAt` of the last
   * row to continue from.
   *
   * Ordered on `updatedAt` rather than `createdAt` so a batch that just took
   * another event rises to the top instead of sitting where it was first
   * written. `createdAt` stays on the row as "when this first happened".
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

    // A closer that never ran cannot leave a batch open forever, so any batch
    // past its window is closed here — the list is where anyone looks first.
    await this.expireOverdueBatches();

    const qb = this.notificationsRepository
      .createQueryBuilder('n')
      .where('n."userId" = :userId', { userId })
      .orderBy('n."updatedAt"', 'DESC')
      .take(take + 1);

    if (options.before && !Number.isNaN(options.before.getTime())) {
      qb.andWhere('n."updatedAt" < :before', { before: options.before });
    }

    const rows = await qb.getMany();
    return rows.map((row) => this.renderForClient(row));
  }

  /**
   * Lists a business's notifications across everyone who works there.
   *
   * Rows are addressed to a user, but the ones a venue cares about — an order,
   * a closed shift, a rating — are events in the business, and the person who
   * happens to hold the row is incidental. Reading them per-user is how a bell
   * ends up empty while something is happening: the owner receives a review
   * only if the review was written for the owner.
   *
   * `businessId` comes from the token, never the query — accepting it would
   * let any signed-in user read any business's rows.
   *
   * The unread total rides along rather than on its own route so the bell and
   * the list that fills it cannot disagree: both come off one query set.
   */
  async findByBusiness(
    businessId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(
      Math.max(1, Number(options.limit) || DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const envelope = { data: [], total: 0, unreadCount: 0, page, limit };

    // A customer carries no businessId, so this is their empty state rather
    // than an error: the route is shared, and a 500 here would break the bell
    // for every customer account on the shared endpoint.
    const staff = await this.userRepository.find({
      where: { businessId },
      select: ['id'],
    });
    const userIds = staff.map((s) => s.id);
    if (userIds.length === 0) return envelope;

    // Same safety net as the personal list: a lost closer must not leave a
    // batch open indefinitely on the venue feed either.
    await this.expireOverdueBatches();

    // Two counts off the scan instead of loading rows twice. `data` and
    // `total` are the same result set; `unreadCount` is the same set filtered.
    const [pageRows, total, unreadCount] = await Promise.all([
      this.notificationsRepository.find({
        where: { userId: In(userIds) },
        order: { updatedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.notificationsRepository.count({ where: { userId: In(userIds) } }),
      this.notificationsRepository.count({
        where: { userId: In(userIds), isRead: false },
      }),
    ]);

    return {
      data: pageRows.map((row) => this.renderForClient(row)),
      total,
      unreadCount,
      page,
      limit,
    };
  }

  /**
   * Applies the aggregate view to a row before it leaves the API.
   *
   * A collapsed row's stored prose describes only its first event, so it is
   * replaced with the grouped sentence ("Jane and 3 others rated your
   * business") and the per-event `stat`/`footnote` are dropped — a single
   * rating's star value cannot speak for four. `groupCount` rides along so a
   * client can badge the row, and `createdAt` is preserved: it is when the
   * group started, which is what a timestamp on a merged row should mean.
   *
   * Rows with `groupCount <= 1` are returned untouched.
   */
  private renderForClient(row: Notification): Notification {
    if (row.groupCount <= 1 || !row.eventType) return row;

    const copy = buildAggregateCopy(
      row.eventType,
      Array.isArray(row.metadata?.actors)
        ? (row.metadata.actors as unknown[])
        : [],
      row.groupCount,
    );
    if (!copy) return row;

    // Shallow-copied so the caller's entity cache is not mutated: TypeORM
    // identities are shared, and rewriting one in place would make the next
    // read of the same row double-substitute.
    return {
      ...row,
      title: copy.title,
      message: copy.message,
      metadata: { ...(row.metadata ?? {}) },
    };
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
