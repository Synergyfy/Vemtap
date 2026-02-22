import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MessagingEngineService } from '../services/messaging-engine.service';
import { CampaignService } from '../services/campaign.service';
import {
  MessageCampaign,
  CampaignStatus,
} from '../entities/message-campaign.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Business } from '../../businesses/entities/business.entity';
import { TemplateService } from '../services/template.service';
import { Channel } from '../enums/channel.enum';

interface BatchJobData {
  campaignId: string;
  businessId: string;
  branchId?: string;
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
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {
    super();
  }

  async process(job: Job<BatchJobData, any, string>): Promise<any> {
    const {
      campaignId,
      businessId,
      branchId,
      contactIds,
      templateId,
      content,
    } = job.data;
    this.logger.log(
      `Processing batch send for campaign ${campaignId}, targeting ${contactIds.length} contacts.`,
    );

    let successCount = 0;
    let failureCount = 0;

    try {
      const business = await this.businessRepo.findOne({
        where: { id: businessId },
      });
      if (!business) {
        this.logger.error(
          `Business ${businessId} not found for campaign ${campaignId}`,
        );
        return { successCount: 0, failureCount: 0 };
      }

      let template: any = null;
      if (templateId) {
        template = await this.templateService.getTemplate(
          templateId,
          businessId,
        );
      }

      // Process in chunks or individually
      for (const contactId of contactIds) {
        try {
          const contact = await this.contactRepo.findOne({
            where: { id: contactId },
          });
          if (!contact) continue;

          const dto = {
            businessId,
            branchId,
            channel: job.data.channel,
            content,
          };
          await this.messagingEngine.processSingleSend(
            contact,
            dto,
            business,
            template,
          );
          successCount++;
        } catch (err) {
          // Log errors per target
          failureCount++;
        }
      }

      // Update campaign status
      await this.campaignService.updateCampaign(campaignId, {
        status: CampaignStatus.SENT,
        actualCost: await this.messagingEngine.calculateCost(
          successCount,
          job.data.channel,
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
