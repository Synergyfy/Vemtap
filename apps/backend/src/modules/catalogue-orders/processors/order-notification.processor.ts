import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogueOrder } from '../entities/catalogue-order.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { MailService } from '../../mail/mail.service';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';
import { PushNotificationService } from '../../notifications/push-notification.service';

/** The statuses `MailService.sendOrderNotification` knows how to word. */
const MAILABLE_STATUSES = [
  'placed',
  'processing',
  'completed',
  'cancelled',
  'rejected',
] as const;

type MailableStatus = (typeof MAILABLE_STATUSES)[number];

const isMailableStatus = (value: string): value is MailableStatus =>
  (MAILABLE_STATUSES as readonly string[]).includes(value);

@Processor('order-notifications')
export class OrderNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderNotificationProcessor.name);

  constructor(
    @InjectRepository(CatalogueOrder)
    private readonly orderRepository: Repository<CatalogueOrder>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string; status: string; title?: string; body?: string }, any, string>): Promise<any> {
    const { orderId, status, title, body } = job.data;
    this.logger.log(`Processing ${status} notifications for order ${orderId}`);

    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['customer', 'items', 'items.item', 'items.offer'],
      });

      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return;
      }

      // The caller supplies customer-facing copy when a status change has
      // something specific to say; fall back to the generic form for the
      // initial 'placed' notification, which carries no copy of its own.
      const pushTitle =
        title || `Order Update: ${status.replace(/_/g, ' ').toLowerCase()}`;
      const pushBody =
        body ||
        `Your order #${order.id} status is now ${status
          .replace(/_/g, ' ')
          .toLowerCase()}.`;

      // 1. Write the in-app row
      if (order.customerId) {
        await this.notificationsService
          .create(
            order.customerId,
            pushTitle,
            pushBody,
            'order_status',
            `/orders/${order.id}`,
          )
          .catch((err) =>
            this.logger.error(
              `Failed to create database notification: ${err.message}`,
            ),
          );

        // 2. Send real-time push notification
        // `category` is what the preference check matches on — the raw
        // `type` string does not correspond to any stored preference key.
        await this.pushNotificationService
          .sendNotification(
            order.customerId,
            pushTitle,
            pushBody,
            {
              orderId: order.id,
              status,
              type: 'ORDER_STATUS_UPDATE',
              category: 'orderUpdates',
            },
            true,
          )
          .catch((err) =>
            this.logger.error(
              `Failed to send push notification: ${err.message}`,
            ),
          );
      }

      // 2. Handle Email
      if (
        !order.customer ||
        !order.customer.email ||
        order.customer.email.includes('@vemtap.dummy')
      ) {
        this.logger.warn(
          `Order ${orderId} has no valid customer email, skipping email.`,
        );
      } else {
        const branch = await this.branchRepository.findOne({
          where: { id: order.branchId },
          relations: ['business'],
        });

        if (!branch) {
          this.logger.error(
            `Branch ${order.branchId} not found for order ${orderId}`,
          );
        } else {
          const business = branch.business;
          if (!business) {
            this.logger.error(`Business for branch ${branch.id} not found`);
          } else if (!isMailableStatus(status)) {
            this.logger.warn(
              `Order ${orderId} has status "${status}" with no email wording — skipping email`,
            );
          } else {
            await this.mailService.sendOrderNotification(
              order.customer.email,
              order,
              status,
              {
                name: business.name,
                address: branch.address,
                phone: branch.phone,
                website: branch.website,
              },
            );
          }
        }
      }

      this.logger.log(
        `Successfully processed all notifications for order ${orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process order notification job: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
