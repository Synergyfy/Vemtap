import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  ExternalAffiliateService,
  AffiliateSyncError,
} from './external-affiliate.service';
import {
  AFFILIATE_EXTERNAL_SYNC_QUEUE,
  RecordReferralJobData,
  ProcessWithdrawalJobData,
} from './external-affiliate.constants';

/**
 * BullMQ processor that syncs referral/withdrawal events to the external
 * affiliate backend.
 *
 * - Transient failures (network, 5xx, 408, 429) throw so BullMQ retries with
 *   exponential back-off (see defaultJobOptions in the module).
 * - Terminal failures (4xx) are logged and swallowed so the job doesn't retry
 *   forever.
 */
@Processor(AFFILIATE_EXTERNAL_SYNC_QUEUE, { concurrency: 3 })
export class AffiliateSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(AffiliateSyncProcessor.name);

  constructor(
    private readonly externalAffiliateService: ExternalAffiliateService,
  ) {
    super();
  }

  async process(
    job: Job<RecordReferralJobData | ProcessWithdrawalJobData>,
  ): Promise<void> {
    switch (job.name) {
      case 'record-referral':
        return this.handleRecordReferral(job as Job<RecordReferralJobData>);
      case 'process-withdrawal':
        return this.handleProcessWithdrawal(
          job as Job<ProcessWithdrawalJobData>,
        );
      default:
        this.logger.warn(`Unknown affiliate sync job name: ${job.name}`);
    }
  }

  private async handleRecordReferral(
    job: Job<RecordReferralJobData>,
  ): Promise<void> {
    const data = job.data;
    try {
      await this.externalAffiliateService.recordReferral(
        data,
        job.id ?? data.externalReference,
      );
    } catch (error) {
      this.handleError(error, `record-referral for ${data.email}`);
    }
  }

  private async handleProcessWithdrawal(
    job: Job<ProcessWithdrawalJobData>,
  ): Promise<void> {
    const data = job.data;
    try {
      await this.externalAffiliateService.processWithdrawal(
        data,
        job.id ?? data.externalReference,
      );
    } catch (error) {
      this.handleError(error, `process-withdrawal for ${data.email}`);
    }
  }

  private handleError(error: any, context: string): void {
    if (error instanceof AffiliateSyncError && !error.retryable) {
      this.logger.warn(
        `Affiliate sync ${context} failed terminally (status=${error.status}): ${error.message}`,
      );
      return; // terminal — don't retry
    }
    this.logger.error(`Affiliate sync ${context} failed: ${error?.message}`);
    throw error; // retryable — let BullMQ retry
  }
}
