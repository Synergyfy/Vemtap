import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MessagingEngineService } from '../services/messaging-engine.service';
import { CampaignService } from '../services/campaign.service';
import { CampaignStatus } from '../entities/message-campaign.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { TemplateService } from '../services/template.service';
import { Channel } from '../enums/channel.enum';

interface BatchJobData {
  campaignId: string;
  branchId: string;
  channel: Channel;
  customerIds: string[]; // These are user IDs with role CUSTOMER
  templateId?: string;
  content?: string;
}

@Processor('messaging-batch-send', {
  drainDelay: 30,
})
export class BatchSendProcessor extends WorkerHost {
  private readonly logger = new Logger(BatchSendProcessor.name);

  constructor(
    private readonly messagingEngine: MessagingEngineService,
    private readonly campaignService: CampaignService,
    private readonly templateService: TemplateService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {
    super();
  }

  async process(job: Job<BatchJobData, any, string>): Promise<any> {
    const { campaignId, branchId, customerIds, templateId, content } = job.data;
    this.logger.log(
      `Processing batch send for campaign ${campaignId}, targeting ${customerIds.length} customers.`,
    );

    let successCount = 0;
    let failureCount = 0;

    try {
      const branch = await this.branchRepo.findOne({
        where: { id: branchId },
        relations: ['business'],
      });
      if (!branch) {
        this.logger.error(
          `Branch ${branchId} not found for campaign ${campaignId}`,
        );
        return { successCount: 0, failureCount: 0 };
      }

      for (const customerId of customerIds) {
        try {
          const customer = await this.userRepo.findOne({
            where: { id: customerId, role: UserRole.CUSTOMER },
          });
          if (!customer) {
            this.logger.warn(`Customer ${customerId} not found or not a customer role`);
            continue;
          }

          let from = '';
          if (job.data.channel === Channel.SMS) {
            from = 'VEMTAP';
          } else if (job.data.channel === Channel.WHATSAPP) {
            from = branch.whatsappNumber || '';
          }

          await this.messagingEngine.processSingleSend(
            branchId,
            customerId,
            content || '',
            job.data.channel,
            from,
            campaignId,
          );
          successCount++;
        } catch (err: any) {
          this.logger.error(`Failed to send message to customer ${customerId} in batch ${campaignId}: ${err.message}`);
          failureCount++;
        }
      }

      await this.campaignService.updateCampaign(campaignId, {
        status: CampaignStatus.SENT,
        actualCost: await this.messagingEngine.calculateCost(
          job.data.channel,
          successCount,
        ),
        sentAt: new Date(),
      });

      this.logger.log(
        `Completed batch send for campaign ${campaignId}. Success: ${successCount}, Failed: ${failureCount}`,
      );
      return { successCount, failureCount };
    } catch (error: any) {
      this.logger.error(
        `Batch job failed completely for campaign ${campaignId}`,
        error.stack,
      );
      await this.campaignService.updateCampaign(campaignId, {
        status: CampaignStatus.FAILED,
      });
      throw error;
    }
  }
}
