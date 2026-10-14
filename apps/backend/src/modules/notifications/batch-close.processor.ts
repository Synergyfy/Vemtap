import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService, NOTIFICATION_BATCH_QUEUE } from './notifications.service';

/**
 * Closes notification batches once their window has elapsed.
 *
 * The batch itself already works without this worker: the read path expires
 * any batch past its window, so a job that never runs only makes a batch
 * close late (when someone looks) rather than never. This exists to close
 * them on time and to fire the coalesced push with the final count, which
 * is the part the read path cannot do — reading a list must not send a
 * notification.
 */
@Processor(NOTIFICATION_BATCH_QUEUE, { concurrency: 5 })
export class BatchCloseProcessor extends WorkerHost {
  private readonly logger = new Logger(BatchCloseProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<{ batchKey: string }>): Promise<void> {
    if (job.name !== 'close') return;
    const { batchKey } = job.data;
    await this.notificationsService.closeBatch(batchKey);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Batch close failed for ${job?.data?.batchKey}: ${error?.message}`,
      error?.stack,
    );
  }
}
