import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { Channel } from '../enums/channel.enum';

interface IndividualMessageJobData {
  branchId: string;
  customerId: string;
  content: string;
  channel: Channel;
  from: string;
  campaignId?: string;
  metadata?: any;
  messageId?: string;
}

@Processor('messaging-individual-send', {
  concurrency: 5, // Process 5 messages in parallel per worker
})
export class IndividualSendProcessor extends WorkerHost {
  private readonly logger = new Logger(IndividualSendProcessor.name);

  constructor(private readonly messagingEngine: MessagingEngineService) {
    super();
  }

  async process(job: Job<IndividualMessageJobData, any, string>): Promise<any> {
    const {
      branchId,
      customerId,
      content,
      channel,
      from,
      campaignId,
      metadata,
      messageId,
    } = job.data;

    this.logger.log(
      `📥 Job started for individual message to Customer ID: ${customerId} (Message ID: ${messageId || 'new'})`,
    );

    try {
      await this.messagingEngine.processSingleSend(
        branchId,
        customerId,
        content,
        channel,
        from,
        campaignId,
        metadata,
        messageId,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process background message for customer ${customerId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
