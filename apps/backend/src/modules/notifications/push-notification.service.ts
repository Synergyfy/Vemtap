import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private isConfigured = false;

  constructor(
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
      } catch (error) {
        this.logger.error(
          `Failed to configure Web Push (VAPID): ${error.message}. Push notifications will be mocked.`,
        );
      }
    } else {
      this.logger.warn(
        'Web Push (VAPID) keys missing. Push notifications will be mocked.',
      );
    }
  }

  async registerToken(userId: string, token: string, isUser: boolean = true) {
    // Token for Web Push is often a JSON string of the subscription object
    if (isUser) {
      await this.userRepo.update(userId, { pushToken: token });
    } else {
      await this.contactRepo.update(userId, { pushToken: token });
    }
    return { success: true };
  }

  async sendNotification(
    targetId: string,
    title: string,
    body: string,
    data: any = {},
    isUser: boolean = true,
  ) {
    let token: string | null | undefined;

    if (isUser) {
      const user = await this.userRepo.findOne({
        where: { id: targetId },
        select: ['pushToken'],
      });
      token = user?.pushToken;
    } else {
      const contact = await this.contactRepo.findOne({
        where: { id: targetId },
        select: ['pushToken'],
      });
      token = contact?.pushToken;
    }

    if (!token) {
      this.logger.debug(
        `No push token for ${isUser ? 'User' : 'Contact'} ${targetId}`,
      );
      return;
    }

    this.logger.log(`Sending push notification to ${targetId}: ${title}`);

    if (!this.isConfigured) {
      this.logger.debug('Push notification mocked (VAPID not configured)');
      return { success: true, mock: true };
    }

    try {
      // Parse token if it's a Web Push subscription object
      let subscription;
      try {
        subscription = JSON.parse(token);
      } catch (e) {
        // If not JSON, it might be a standard FCM token which we don't handle with web-push
        this.logger.error(
          `Invalid subscription format for ${targetId}. Web Push requires JSON subscription object.`,
        );
        return { success: false, error: 'Invalid subscription format' };
      }

      const payload = JSON.stringify({
        notification: {
          title,
          body,
          icon: '/logo.png', // Assuming logo.png is in public folder
          data: {
            ...data,
            url: data.threadId
              ? `/dashboard/messaging/${data.threadId}`
              : undefined,
          },
        },
      });

      await webpush.sendNotification(subscription, payload);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error sending push notification to ${targetId}: ${error.message}`,
      );

      // If subscription is expired or invalid, clear it
      if (error.statusCode === 410 || error.statusCode === 404) {
        this.logger.warn(
          `Push subscription for ${targetId} is no longer valid. Clearing token.`,
        );
        if (isUser) {
          await this.userRepo.update(targetId, { pushToken: null });
        } else {
          await this.contactRepo.update(targetId, { pushToken: null });
        }
      }

      return { success: false, error: error.message };
    }
  }

  async sendToBranchStaff(
    branchId: string,
    title: string,
    body: string,
    data: any = {},
  ) {
    const staff = await this.userRepo.find({
      where: { branchId },
      select: ['id', 'pushToken'],
    });

    const staffWithTokens = staff.filter((s) => !!s.pushToken);

    if (staffWithTokens.length === 0) {
      this.logger.debug(`No push tokens for staff in branch ${branchId}`);
      return;
    }

    this.logger.log(
      `Sending push notification to ${staffWithTokens.length} staff in branch ${branchId}: ${title}`,
    );

    const results = await Promise.all(
      staffWithTokens.map((s) =>
        this.sendNotification(s.id, title, body, data, true),
      ),
    );

    const successCount = results.filter((r) => r?.success).length;

    return {
      success: true,
      count: successCount,
      total: staffWithTokens.length,
    };
  }
}
