import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  AFFILIATE_EXTERNAL_SYNC_QUEUE,
  RecordReferralJobData,
  ProcessWithdrawalJobData,
  recordReferralJobId,
  processWithdrawalJobId,
} from './external-affiliate.constants';

/**
 * Enqueue facade for external affiliate sync jobs.
 *
 * The deterministic `jobId` gives enqueue-side idempotency: re-enqueuing the
 * same logical event reuses the same BullMQ job, so no duplicates are created
 * even if the upstream flow retries. Delivery-side idempotency is handled by
 * the `Idempotency-Key` header sent to the external backend.
 */
@Injectable()
export class AffiliateSyncService {
  constructor(
    @InjectQueue(AFFILIATE_EXTERNAL_SYNC_QUEUE)
    private readonly syncQueue: Queue,
  ) {}

  async enqueueRecordReferral(data: RecordReferralJobData): Promise<void> {
    await this.syncQueue.add(
      'record-referral',
      data,
      { jobId: recordReferralJobId(data.externalReference) },
    );
  }

  async enqueueProcessWithdrawal(
    data: ProcessWithdrawalJobData,
  ): Promise<void> {
    await this.syncQueue.add(
      'process-withdrawal',
      data,
      { jobId: processWithdrawalJobId(data.externalReference) },
    );
  }
}
