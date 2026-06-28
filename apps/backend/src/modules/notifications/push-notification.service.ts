import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import {
  PUSH_NOTIFICATION_QUEUE,
  PushNotificationJobData,
  PushFanOutJobData,
} from './push-notification.processor';

/**
 * PushNotificationService — the public API for triggering push notifications.
 *
 * All methods now enqueue a BullMQ job and return immediately.
 * The actual web-push delivery happens asynchronously in PushNotificationProcessor,
 * with automatic retries on failure and no impact on the calling HTTP request's latency.
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private isConfigured = false;

  constructor(
    @InjectQueue(PUSH_NOTIFICATION_QUEUE)
    private readonly pushQueue: Queue<
      PushNotificationJobData | PushFanOutJobData
    >,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    private readonly configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const email = this.configService.get<string>(
      'VAPID_EMAIL',
      'mailto:admin@vemtap.com',
    );

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(email, publicKey, privateKey);
        this.isConfigured = true;
        this.logger.log('Web Push (VAPID) configured successfully');
      } catch (error: any) {
        this.logger.error(
          `Failed to configure Web Push (VAPID): ${error.message}. Push notifications will be disabled.`,
        );
      }
    } else {
      this.logger.warn(
        'Web Push (VAPID) keys missing. Push notifications will be disabled.',
      );
    }
  }

  /** Persist the push subscription token for a user or contact. */
  async registerToken(userId: string, token: string, isUser = true) {
    if (isUser) {
      await this.userRepo.update(userId, { pushToken: token });
    } else {
      await this.contactRepo.update(userId, { pushToken: token });
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
    if (!this.isConfigured) {
      this.logger.debug(
        'Push notifications disabled (VAPID not configured) — skipping',
      );
      return { queued: false, reason: 'vapid-not-configured' };
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
   */
  async sendToBranchStaff(
    branchId: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<{ queued: true } | { queued: false; reason: string }> {
    if (!this.isConfigured) {
      this.logger.debug(
        'Push notifications disabled (VAPID not configured) — skipping fan-out',
      );
      return { queued: false, reason: 'vapid-not-configured' };
    }

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
}
