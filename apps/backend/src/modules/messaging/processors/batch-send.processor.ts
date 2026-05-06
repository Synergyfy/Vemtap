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
import { MessageDirection } from '../enums/message.enum';
import { formatPhoneNumber } from '../../../common/utils/phone.util';

interface BatchJobData {
  campaignId: string;
  branchId: string;
  channel: Channel;
  customerIds: string[]; // These are user IDs with role CUSTOMER
  templateId?: string;
  content?: string;
  from?: string;
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
    const {
      campaignId,
      branchId,
      customerIds,
      templateId,
      content,
      from: jobFrom,
    } = job.data;
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

      // Determine if we can use bulk sending optimization (Generic SMS only)
      const isGenericSms =
        job.data.channel === Channel.SMS &&
        !this.messagingEngine.hasPlaceholders(content || '');

      const CHUNK_SIZE = isGenericSms ? 100 : 20;

      for (let i = 0; i < customerIds.length; i += CHUNK_SIZE) {
        const chunk = customerIds.slice(i, i + CHUNK_SIZE);

        if (isGenericSms) {
          const bulkMessages: any[] = [];

          await Promise.all(
            chunk.map(async (customerId) => {
              try {
                const customer = await this.userRepo.findOne({
                  where: { id: customerId, role: UserRole.CUSTOMER },
                });

                if (!customer || !customer.phone) return;

                const thread = await this.messagingEngine.getOrCreateThread(
                  branch.id,
                  customerId,
                  Channel.SMS,
                );

                const message = await this.messagingEngine.createMessage({
                  branchId: branch.id,
                  businessId: branch.businessId,
                  customerId,
                  threadId: thread.id,
                  campaignId,
                  content: content || '',
                  channel: Channel.SMS,
                  direction: MessageDirection.OUTBOUND,
                  from: jobFrom || 'VEMTAP',
                  to: formatPhoneNumber(customer.phone),
                  metadata: {},
                });

                bulkMessages.push(message);
              } catch (err: any) {
                this.logger.error(
                  `Failed to prepare bulk message for ${customerId}: ${err.message}`,
                );
                failureCount++;
              }
            }),
          );

          if (bulkMessages.length > 0) {
            try {
              await this.messagingEngine.sendBulkGenericSms(
                bulkMessages,
                content || '',
                jobFrom || 'VEMTAP',
              );
              successCount += bulkMessages.length;
            } catch (err: any) {
              this.logger.error(
                `Bulk send failed for chunk: ${err.message}`,
                err.stack,
              );
              failureCount += bulkMessages.length;
            }
          }
        } else {
          // Individual processing (Personalized or non-SMS)
          await Promise.all(
            chunk.map(async (customerId) => {
              try {
                const customer = await this.userRepo.findOne({
                  where: { id: customerId, role: UserRole.CUSTOMER },
                });

                if (!customer) {
                  this.logger.warn(
                    `Customer ${customerId} not found or not a customer role`,
                  );
                  return;
                }

                const customerName =
                  `${customer.firstName} ${customer.lastName}`.trim() ||
                  'Customer';
                this.logger.log(
                  `🚀 Starting batch message for ${customerName} (${customer.phone || customer.email})`,
                );

                let from = jobFrom || '';
                if (!from) {
                  if (job.data.channel === Channel.SMS) {
                    from = 'VEMTAP';
                  } else if (job.data.channel === Channel.WHATSAPP) {
                    from = branch.whatsappNumber || '';
                  }
                }

                const resolvedContent =
                  await this.messagingEngine.resolvePlaceholders(
                    content || '',
                    customerId,
                    branch,
                  );

                const thread = await this.messagingEngine.getOrCreateThread(
                  branch.id,
                  customerId,
                  job.data.channel,
                );

                const message = await this.messagingEngine.createMessage({
                  branchId: branch.id,
                  businessId: branch.businessId,
                  customerId,
                  threadId: thread.id,
                  campaignId,
                  content: resolvedContent,
                  channel: job.data.channel,
                  direction: MessageDirection.OUTBOUND,
                  from,
                  to:
                    job.data.channel === Channel.EMAIL
                      ? customer.email || ''
                      : formatPhoneNumber(customer.phone || ''),
                  metadata: {},
                });

                await this.messagingEngine.queueIndividualSend({
                  branchId: branch.id,
                  customerId,
                  content: resolvedContent,
                  channel: job.data.channel,
                  from,
                  campaignId,
                  messageId: message.id,
                  delay: 0,
                });

                successCount++;
              } catch (err: any) {
                this.logger.error(
                  `Failed to send message to customer ${customerId} in batch ${campaignId}: ${err.message}`,
                );
                failureCount++;
              }
            }),
          );
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
