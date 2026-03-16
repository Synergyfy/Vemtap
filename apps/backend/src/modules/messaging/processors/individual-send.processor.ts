import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { Channel } from '../enums/channel.enum';

interface IndividualMessageJobData {
  branchId: string;
  contactId: string;
  content: string;
  channel: Channel;
  from: string;
  campaignId?: string;
}

@Processor('messaging-individual-send', {
  concurrency: 5, // Process 5 messages in parallel per worker
})
export class IndividualSendProcessor extends WorkerHost {
  private readonly logger = new Logger(IndividualSendProcessor.name);

  constructor(
    private readonly messagingEngine: MessagingEngineService,
  ) {
    super();
  }

  async process(job: Job<IndividualMessageJobData, any, string>): Promise<any> {
    const { branchId, contactId, content, channel, from, campaignId } = job.data;
    
    this.logger.log(`Processing background message for contact ${contactId} in branch ${branchId}`);

    try {
      await this.messagingEngine.processSingleSend(
        branchId,
        contactId,
        content,
        channel,
        from,
        campaignId,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process background message for contact ${contactId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
