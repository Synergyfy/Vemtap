import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogueOrder } from '../entities/catalogue-order.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Business } from '../../businesses/entities/business.entity';
import { MailService } from '../../mail/mail.service';
import { Logger } from '@nestjs/common';

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
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { orderId, status } = job.data;
    this.logger.log(`Processing \${status} email for order \${orderId}`);

    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['customer', 'items', 'items.item', 'items.offer'],
      });

      if (!order) {
        this.logger.error(`Order \${orderId} not found`);
        return;
      }

      if (!order.customer || !order.customer.email || order.customer.email.includes('@vemtap.dummy')) {
        this.logger.warn(`Order \${orderId} has no valid customer email, skipping email.`);
        return;
      }

      const branch = await this.branchRepository.findOne({
        where: { id: order.branchId },
        relations: ['business'],
      });

      if (!branch) {
        this.logger.error(`Branch \${order.branchId} not found for order \${orderId}`);
        return;
      }

      const business = branch.business;
      if (!business) {
        this.logger.error(`Business for branch \${branch.id} not found`);
        return;
      }

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

      this.logger.log(`Successfully sent \${status} email for order \${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to process order email job: \${error.message}`, error.stack);
      throw error;
    }
  }
}
