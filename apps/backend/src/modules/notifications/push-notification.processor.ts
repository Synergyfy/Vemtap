import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { PushToken, PushTransport } from './entities/push-token.entity';
import { webPushConfig } from './web-push-config';
import { blockedByPreference } from './notification-preferences';

export const PUSH_NOTIFICATION_QUEUE = 'notifications-push';

/**
 * Deep link prefix for chat threads, matching the app's route.
 *
 * `/messages`, not `/messaging` — the app resolves a tap through a single
 * allowlist (`notificationRoutes.ts`, consumed by both the notification centre
 * and the push-tap handler) and it matches the `/messages/<id>` segment that the
 * notification *rows* already carry. The namespace on the socket is
 * `/messaging`; the deep link a push carries is a path, and those are two
 * different things. Sending the namespace name here produced a URL no resolver
 * recognised, so every messaging push tap silently did nothing.
 */
const MESSAGING_PATH = '/messages';

/** Deep link prefix for the web dashboard's messaging view. */
const WEB_MESSAGING_PATH = '/dashboard/messaging';

export interface PushNotificationJobData {
  /** DB id of the user or contact to notify */
  targetId: string;
  /** Whether the target is a User (true) or Contact (false) */
  isUser: boolean;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushFanOutJobData {
  /** List of user IDs to fan-out to */
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

/** A resolved target and the transport its token speaks. */
interface Deliverable {
  targetId: string;
  isUser: boolean;
  token: string;
  transport: PushTransport;
  /** Maps this deliverable back to the push_tokens row to invalidate it. */
  pushTokenId?: string;
}

/**
 * BullMQ processor for all push notification delivery.
 *
 * Moving push delivery here means:
 *  - The HTTP request that triggers a notification returns immediately.
 *  - Failed deliveries are retried automatically (3 attempts, exponential back-off).
 *  - Expired/invalid subscriptions are cleaned up without blocking the caller.
 *  - A slow push service cannot hold up an API response.
 *
 * Delivery branches on the token's transport: Expo push for the mobile app,
 * Web Push (VAPID) for the browser service worker.
 */
@Processor(PUSH_NOTIFICATION_QUEUE, {
  // Process at most 5 push deliveries concurrently per worker instance.
  // High enough for throughput, low enough to not exhaust connections.
  concurrency: 5,
})
export class PushNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(PushNotificationProcessor.name);
  private readonly expo: Expo;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
  ) {
    super();
    // No access token: works without one, just rate-limited. Supply
    // EXPO_ACCESS_TOKEN later for higher limits.
    this.expo = new Expo();
  }

  async process(
    job: Job<PushNotificationJobData | PushFanOutJobData>,
  ): Promise<void> {
    switch (job.name) {
      case 'send':
        return this.handleSend(job as Job<PushNotificationJobData>);
      case 'fanout':
        return this.handleFanOut(job as Job<PushFanOutJobData>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Job handlers
  // ---------------------------------------------------------------------------

  private async handleSend(job: Job<PushNotificationJobData>): Promise<void> {
    const { targetId, isUser, title, body, data = {} } = job.data;

    // A user can hold several devices, so every one of them is notified.
    const deliverables = isUser
      ? await this.resolveMany([targetId])
      : await this.resolveContact(targetId);

    if (deliverables.length === 0) {
      this.logger.debug(
        `No push token for ${isUser ? 'User' : 'Contact'} ${targetId} — skipping`,
      );
      return;
    }

    await Promise.allSettled(
      deliverables.map((d) => this.deliver(d, title, body, data)),
    );
  }

  private async handleFanOut(job: Job<PushFanOutJobData>): Promise<void> {
    const { userIds, title, body, data = {} } = job.data;

    const deliverables = await this.resolveMany(userIds);
    const allowed = await this.applyFanOutPreferences(deliverables, data);

    if (allowed.length === 0) {
      this.logger.debug(
        `Fan-out: no deliverable tokens for ${userIds.length} users`,
      );
      return;
    }

    this.logger.log(
      `Fan-out: delivering to ${allowed.length} of ${userIds.length} users` +
        (allowed.length < userIds.length ? ' (some opted out)' : ''),
    );

    await Promise.allSettled(
      allowed.map((d) => this.deliver(d, title, body, data)),
    );
  }

  /**
   * Drops recipients whose own preferences opt them out of this notification.
   *
   * The fan-out has no single recipient to check before queuing, so the
   * per-user preference has to be applied here — otherwise a staff member who
   * turned branch alerts off still gets every one of them.
   */
  private async applyFanOutPreferences(
    deliverables: Deliverable[],
    data: Record<string, any>,
  ): Promise<Deliverable[]> {
    if (deliverables.length === 0) return [];

    const ids = [...new Set(deliverables.map((d) => d.targetId))];
    const users = await this.userRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.notificationPreferences'])
      .where('u.id IN (:...ids)', { ids })
      .getMany();

    const preferencesById = new Map(
      users.map((u) => [u.id, u.notificationPreferences]),
    );

    return deliverables.filter(
      (d) => !blockedByPreference(preferencesById.get(d.targetId), data),
    );
  }

  private async deliver(
    target: Deliverable,
    title: string,
    body: string,
    data: Record<string, any>,
  ): Promise<void> {
    if (target.transport === PushTransport.EXPO) {
      await this.deliverExpo(target, title, body, data);
      return;
    }
    await this.deliverWebPush(target, title, body, data);
  }

  private async deliverExpo(
    target: Deliverable,
    title: string,
    body: string,
    data: Record<string, any>,
  ): Promise<void> {
    const deepLink =
      data.url ??
      (data.threadId ? `${MESSAGING_PATH}/${data.threadId}` : undefined);

    const message: ExpoPushMessage = {
      to: target.token,
      title,
      body,
      sound: 'default',
      priority: 'high',
      // The app's Android channel, set up in pushNotifications.ts.
      channelId: 'default',
      // The tap handler reads this. Expo caps `data` values by total
      // payload size, so only primitives travel and `url` stays a path.
      data: { ...data, url: deepLink },
    };

    try {
      const [ticket] = await this.expo.sendPushNotificationsAsync([message]);

      if (!ticket) {
        throw new Error('Expo returned no ticket for the message');
      }

      if (ticket.status === 'error') {
        await this.handleExpoTicketError(target, ticket);
        return;
      }

      // The ticket only proves Expo accepted the message. FCM/APNs acceptance
      // is confirmed later by the receipt, which needs a second round-trip.
      await this.markUsed(target);
      this.logger.debug(`Expo ticket ${ticket.id} for ${target.targetId}`);
    } catch (error: any) {
      this.logger.error(
        `Expo delivery failed for ${target.targetId}: ${error.message}`,
      );
      throw error;
    }
  }

  private async deliverWebPush(
    target: Deliverable,
    title: string,
    body: string,
    data: Record<string, any>,
  ): Promise<void> {
    let subscription: any;
    try {
      subscription = JSON.parse(target.token);
    } catch {
      this.logger.error(
        `Invalid push subscription format for ${target.targetId} — clearing token`,
      );
      await this.invalidate(target);
      return;
    }

    // No VAPID keys means nothing can be sent. Terminal, not retryable, so
    // the job does not burn its attempts on a config problem.
    if (!webPushConfig.isConfigured()) {
      this.logger.debug(
        `Web push not configured (VAPID keys missing) — skipping ${target.targetId}`,
      );
      return;
    }

    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/logo.png',
        data: {
          ...data,
          url:
            data.url ??
            (data.threadId
              ? `${WEB_MESSAGING_PATH}/${data.threadId}`
              : undefined),
        },
      },
    });

    try {
      await webpush.sendNotification(subscription, payload);
      await this.markUsed(target);
      this.logger.debug(`Web push delivered to ${target.targetId}`);
    } catch (error: any) {
      // 410 Gone / 404 Not Found = subscription expired — clear it, don't retry
      if (error.statusCode === 410 || error.statusCode === 404) {
        this.logger.warn(
          `Push subscription for ${target.targetId} expired (${error.statusCode}) — clearing token`,
        );
        await this.invalidate(target);
        return; // Don't throw — this is a terminal failure, no point retrying
      }

      // Any other error: throw so BullMQ retries with exponential back-off
      this.logger.error(
        `Push delivery failed for ${target.targetId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Maps Expo's ticket-level error onto the right token action.
   *
   * DeviceNotRegistered is terminal (the token is dead), while
   * MessageRateExceeded is not the token's fault — dropping the user's only
   * registered device over our own rate limit would be wrong.
   */
  private async handleExpoTicketError(
    target: Deliverable,
    ticket: { message: string; details?: { error?: string } },
  ): Promise<void> {
    const code = ticket.details?.error;
    this.logger.warn(
      `Expo ticket error for ${target.targetId} (${code ?? 'unknown'}): ${ticket.message}`,
    );

    if (code === 'DeviceNotRegistered') {
      await this.invalidate(target);
      return;
    }

    if (code === 'MessageRateExceeded') {
      return; // Let BullMQ retry later; do not drop the token.
    }

    if (code === 'InvalidCredentials' || code === 'DeveloperError') {
      // Our configuration, not the recipient's device. Retrying without a fix
      // just burns attempts, so swallow it and keep the token.
      return;
    }

    throw new Error(ticket.message);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async resolveContact(targetId: string): Promise<Deliverable[]> {
    const contact = await this.contactRepo.findOne({
      where: { id: targetId },
      select: ['pushToken'],
    });
    if (!contact?.pushToken) return [];
    return [this.toDeliverable(targetId, false, contact.pushToken)];
  }

  private async resolveMany(userIds: string[]): Promise<Deliverable[]> {
    if (userIds.length === 0) return [];

    const tokens = await this.pushTokenRepo
      .createQueryBuilder('t')
      .where('t."userId" IN (:...ids)', { ids: userIds })
      .orderBy('t."updatedAt"', 'DESC')
      .getMany();

    // Every registered device is notified, not just the newest one. A user with
    // a phone and a tablet has two rows here, and collapsing them to a single
    // deliverable silently dropped the notification from whichever device was
    // not the most recently registered — the one holding the app in a pocket.
    //
    // Ordering is still useful, so it is kept for the legacy fallback below:
    // the first row seen for a user is that user's most recent token.
    const out: Deliverable[] = [];
    const covered = new Set<string>();

    for (const row of tokens) {
      if (!row.userId) continue;
      covered.add(row.userId);
      out.push({
        targetId: row.userId,
        isUser: true,
        token: row.token,
        transport: row.transport,
        pushTokenId: row.id,
      });
    }

    // Users with no push_tokens row at all still reach us through the legacy
    // column, which is a single slot by schema — so this is genuinely one
    // deliverable per user, unlike the table above.
    const missing = userIds.filter((id) => !covered.has(id));

    const legacy = new Map<string, string | null>();
    if (missing.length > 0) {
      const rows = await this.userRepo
        .createQueryBuilder('u')
        .select(['u.id', 'u.pushToken'])
        .where('u.id IN (:...ids)', { ids: missing })
        .getMany();
      for (const row of rows) {
        legacy.set(row.id, row.pushToken ?? null);
      }
    }

    for (const userId of missing) {
      const token = legacy.get(userId);
      if (!token) continue;
      out.push(this.toDeliverable(userId, true, token));
    }
    return out;
  }

  /**
   * The legacy column only ever held Web Push subscriptions, so anything that
   * is not parseable as JSON is treated as an Expo token — Expo tokens are
   * `ExponentPushToken[…]`, which is not JSON.
   */
  private toDeliverable(
    targetId: string,
    isUser: boolean,
    token: string,
  ): Deliverable {
    let transport = PushTransport.WEB;
    try {
      JSON.parse(token);
    } catch {
      transport = PushTransport.EXPO;
    }
    return { targetId, isUser, token, transport };
  }

  private async markUsed(target: Deliverable): Promise<void> {
    if (!target.pushTokenId) return;
    try {
      await this.pushTokenRepo.update(target.pushTokenId, {
        lastUsedAt: new Date(),
      });
    } catch {
      // Cosmetic only — never fail a successful delivery over it.
    }
  }

  /** Drops a token the provider says is permanently dead. */
  private async invalidate(target: Deliverable): Promise<void> {
    if (target.pushTokenId) {
      await this.pushTokenRepo
        .softDelete(target.pushTokenId)
        .catch(() => undefined);
      return;
    }
    if (!target.isUser) {
      await this.contactRepo
        .update(target.targetId, { pushToken: null })
        .catch(() => undefined);
      return;
    }
    await this.userRepo
      .update(target.targetId, { pushToken: null })
      .catch(() => undefined);
  }
}
