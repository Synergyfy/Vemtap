import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

export const PUSH_NOTIFICATION_QUEUE = 'notifications-push';

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

/**
 * BullMQ processor for all push notification delivery.
 *
 * Moving push delivery here means:
 *  - The HTTP request that triggers a notification returns immediately.
 *  - Failed deliveries are retried automatically (3 attempts, exponential back-off).
 *  - Expired/invalid subscriptions are cleaned up without blocking the caller.
 *  - A slow web-push service cannot hold up an API response.
 */
@Processor(PUSH_NOTIFICATION_QUEUE, {
  // Process at most 5 push deliveries concurrently per worker instance.
  // High enough for throughput, low enough to not exhaust connections.
  concurrency: 5,
})
export class PushNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(PushNotificationProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {
    super();
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

    const token = await this.resolveToken(targetId, isUser);
    if (!token) {
      this.logger.debug(
        `No push token for ${isUser ? 'User' : 'Contact'} ${targetId} — skipping`,
      );
      return;
    }

    await this.deliver(targetId, isUser, token, title, body, data);
  }

  private async handleFanOut(job: Job<PushFanOutJobData>): Promise<void> {
    const { userIds, title, body, data = {} } = job.data;

    // Fetch tokens for all target users in one query
    const users = await this.userRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.pushToken'])
      .where('u.id IN (:...ids)', { ids: userIds })
      .andWhere('u.pushToken IS NOT NULL')
      .getMany();

    if (users.length === 0) {
      this.logger.debug(
        `Fan-out: no push tokens found for ${userIds.length} users`,
      );
      return;
    }

    this.logger.log(
      `Fan-out: delivering to ${users.length} / ${userIds.length} users with tokens`,
    );

    // Deliver to all concurrently within this single job
    await Promise.allSettled(
      users.map((u) =>
        this.deliver(u.id, true, u.pushToken!, title, body, data),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Core delivery — shared by both handlers
  // ---------------------------------------------------------------------------

  private async deliver(
    targetId: string,
    isUser: boolean,
    rawToken: string,
    title: string,
    body: string,
    data: Record<string, any>,
  ): Promise<void> {
    let subscription: any;
    try {
      subscription = JSON.parse(rawToken);
    } catch {
      this.logger.error(
        `Invalid push subscription format for ${targetId} — clearing token`,
      );
      await this.clearToken(targetId, isUser);
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
              ? `/dashboard/messaging/${data.threadId}`
              : undefined),
        },
      },
    });

    try {
      await webpush.sendNotification(subscription, payload);
      this.logger.debug(`Push delivered to ${targetId}`);
    } catch (error: any) {
      // 410 Gone / 404 Not Found = subscription expired — clear it, don't retry
      if (error.statusCode === 410 || error.statusCode === 404) {
        this.logger.warn(
          `Push subscription for ${targetId} expired (${error.statusCode}) — clearing token`,
        );
        await this.clearToken(targetId, isUser);
        return; // Don't throw — this is a terminal failure, no point retrying
      }

      // Any other error: throw so BullMQ retries with exponential back-off
      this.logger.error(
        `Push delivery failed for ${targetId}: ${error.message}`,
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async resolveToken(
    targetId: string,
    isUser: boolean,
  ): Promise<string | null> {
    if (isUser) {
      const user = await this.userRepo.findOne({
        where: { id: targetId },
        select: ['pushToken'],
      });
      return user?.pushToken ?? null;
    }
    const contact = await this.contactRepo.findOne({
      where: { id: targetId },
      select: ['pushToken'],
    });
    return contact?.pushToken ?? null;
  }

  private async clearToken(targetId: string, isUser: boolean): Promise<void> {
    if (isUser) {
      await this.userRepo.update(targetId, { pushToken: null });
    } else {
      await this.contactRepo.update(targetId, { pushToken: null });
    }
  }
}
