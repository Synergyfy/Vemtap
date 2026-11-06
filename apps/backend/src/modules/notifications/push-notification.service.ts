import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { PushToken, PushTransport } from './entities/push-token.entity';
import { webPushConfig } from './web-push-config';
import { blockedByPreference } from './notification-preferences';
import {
  PUSH_NOTIFICATION_QUEUE,
  PushNotificationJobData,
  PushFanOutJobData,
} from './push-notification.processor';

/**
 * PushNotificationService — the public API for triggering push notifications.
 *
 * All methods now enqueue a BullMQ job and return immediately.
 * The actual delivery happens asynchronously in PushNotificationProcessor,
 * with automatic retries on failure and no impact on the calling HTTP request's latency.
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private isWebConfigured = false;

  constructor(
    @InjectQueue(PUSH_NOTIFICATION_QUEUE)
    private readonly pushQueue: Queue<
      PushNotificationJobData | PushFanOutJobData
    >,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
    private readonly configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const email = this.configService.get<string>(
      'VAPID_EMAIL',
      'mailto:admin@vemtap.com',
    );

    // Web Push is browser-only; Expo push needs no credentials, so this gate
    // must not stop Expo deliveries.
    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(email, publicKey, privateKey);
        webPushConfig.markConfigured(true);
        this.isWebConfigured = true;
        const fingerprint = publicKey.replace(/[_-]/g, '').slice(0, 12);
        this.logger.log(
          `Web Push (VAPID) configured successfully (public key ${fingerprint}…)`,
        );
      } catch (error: any) {
        webPushConfig.markConfigured(false);
        this.logger.error(
          `Failed to configure Web Push (VAPID): ${error.message}. Web push notifications will be disabled.`,
        );
      }
    } else {
      webPushConfig.markConfigured(false);
      this.logger.warn(
        'Web Push (VAPID) keys missing (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). Browser push will be disabled — Expo push is unaffected.',
      );
    }
  }

  /**
   * Register a push token for a user.
   *
   * Expo tokens land in `push_tokens`, which is per-device: a user may hold
   * several, and re-registering the same token upserts rather than duplicating.
   *
   * A Web Push subscription is stored as-is and, if the caller is the browser
   * client, also mirrors onto `users.pushToken` so the legacy reader keeps
   * working until it is retired.
   */
  async registerToken(
    userId: string,
    token: string,
    isUser = true,
    transport: PushTransport | string = PushTransport.EXPO,
    platform?: string,
  ) {
    const normalised = this.normaliseTransport(transport, token);

    if (normalised === PushTransport.WEB) {
      // Existing browser behaviour: a single slot on the user row.
      if (isUser) {
        await this.userRepo.update(userId, { pushToken: token });
      } else {
        await this.contactRepo.update(userId, { pushToken: token });
      }
      return { success: true, transport: PushTransport.WEB };
    }

    // Expo: per-device rows. `token` is unique, so this is an upsert and a
    // device re-registering itself refreshes its row rather than adding one.
    await this.pushTokenRepo
      .createQueryBuilder()
      .insert()
      .into(PushToken)
      .values({
        userId,
        token,
        transport: PushTransport.EXPO,
        platform: platform ?? null,
      })
      .orIgnore()
      .execute();

    return { success: true, transport: PushTransport.EXPO };
  }

  /**
   * Drop one token, or every token for the user when none is given.
   *
   * Logging out should revoke all devices rather than whichever token the
   * client happened to send, so a stolen session's notification stop is
   * still complete.
   */
  async clearToken(userId: string, isUser = true, token?: string) {
    await this.pushTokenRepo.softDelete(token ? { userId, token } : { userId });
    if (isUser) {
      await this.userRepo.update(userId, { pushToken: null });
    } else {
      await this.contactRepo.update(userId, { pushToken: null });
    }
    return { success: true };
  }

  /**
   * Enqueues a push notification for a single user or contact.
   *
   * Returns as soon as the job is queued — delivery happens asynchronously.
   * The job is retried up to 3 times with exponential back-off on failure.
   */
  async sendNotification(
    targetId: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
    isUser = true,
  ): Promise<{ queued: true } | { queued: false; reason: string }> {
    if (isUser) {
      const user = await this.userRepo.findOne({
        where: { id: targetId },
        select: ['id', 'notificationPreferences'],
      });

      if (blockedByPreference(user?.notificationPreferences, data)) {
        return { queued: false, reason: 'disabled-by-user-preference' };
      }
    }

    await this.pushQueue.add(
      'send',
      { targetId, isUser, title, body, data } satisfies PushNotificationJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: 500,
      },
    );

    this.logger.debug(
      `Push job queued for ${isUser ? 'User' : 'Contact'} ${targetId}`,
    );
    return { queued: true };
  }

  /**
   * Fan-out push notifications to all staff in a branch.
   *
   * Uses a single 'fanout' job that resolves tokens and delivers in the worker,
   * so the HTTP request doesn't block on N DB lookups + N HTTP calls.
   *
   * Unlike `sendNotification`, this has no single recipient to read
   * preferences from, so each staff member's own preference is resolved during
   * delivery instead of here.
   */
  async sendToBranchStaff(
    branchId: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<{ queued: true } | { queued: false; reason: string }> {
    // Resolve the list of user IDs now (cheap indexed query), then let
    // the worker handle the per-user token lookups and deliveries.
    const staff = await this.userRepo.find({
      where: { branchId },
      select: ['id'],
    });

    if (staff.length === 0) {
      this.logger.debug(
        `No staff found for branch ${branchId} — skipping fan-out`,
      );
      return { queued: false, reason: 'no-staff' };
    }

    const userIds = staff.map((s) => s.id);

    await this.pushQueue.add(
      'fanout',
      { userIds, title, body, data } satisfies PushFanOutJobData,
      {
        attempts: 2, // Fan-outs are best-effort; 2 attempts is enough
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
        removeOnFail: 200,
      },
    );

    this.logger.debug(
      `Push fan-out job queued for branch ${branchId} (${userIds.length} staff)`,
    );
    return { queued: true };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private normaliseTransport(
    transport: PushTransport | string,
    token: string,
  ): PushTransport {
    // A transport the caller named explicitly wins; anything else is sniffed.
    // Expo tokens are `ExponentPushToken[…]`, which is not JSON, whereas a
    // Web Push subscription is a serialised object.
    const known = Object.values(PushTransport) as string[];
    if (known.includes(transport)) {
      return transport as PushTransport;
    }
    try {
      JSON.parse(token);
      return PushTransport.WEB;
    } catch {
      return PushTransport.EXPO;
    }
  }
}
