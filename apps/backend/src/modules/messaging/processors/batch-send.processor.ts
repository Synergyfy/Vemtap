import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MessagingEngineService } from '../services/messaging-engine.service';
import { CampaignService } from '../services/campaign.service';
import { CampaignStatus } from '../entities/message-campaign.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { TemplateService } from '../services/template.service';
import { Channel } from '../enums/channel.enum';

interface BatchJobData {
  campaignId: string;
  branchId: string;
  channel: Channel;
  contactIds: string[];
  templateId?: string;
  content?: string;
}

@Processor('messaging-batch-send')
export class BatchSendProcessor extends WorkerHost {
  private readonly logger = new Logger(BatchSendProcessor.name);

  constructor(
    private readonly messagingEngine: MessagingEngineService,
    private readonly campaignService: CampaignService,
    private readonly templateService: TemplateService,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {
    super();
  }

  async process(job: Job<BatchJobData, any, string>): Promise<any> {
    const { campaignId, branchId, contactIds, templateId, content } = job.data;
    this.logger.log(
      `Processing batch send for campaign ${campaignId}, targeting ${contactIds.length} contacts.`,
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

      let template: any = null;
      if (templateId) {
        template = await this.templateService.getTemplate(templateId);
      }

      for (const contactId of contactIds) {
        try {
          const contact = await this.contactRepo.findOne({
            where: { id: contactId },
          });
          if (!contact) continue;

          const from = branch.whatsappNumber || '';
          await this.messagingEngine.processSingleSend(
            branchId,
            contactId,
            content || '',
            job.data.channel,
            from,
          );
          successCount++;
        } catch (err) {
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
    } catch (error) {
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
