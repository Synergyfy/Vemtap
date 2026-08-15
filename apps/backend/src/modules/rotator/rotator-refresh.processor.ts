import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RotatorAnalyticsService } from './rotator-analytics.service';
import {
  ROTATOR_REFRESH_QUEUE,
  RotatorImpressionJobData,
  RotatorViewClickJobData,
} from './rotator.constants';

@Processor(ROTATOR_REFRESH_QUEUE, { concurrency: 5 })
export class RotatorRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(RotatorRefreshProcessor.name);

  constructor(private readonly analytics: RotatorAnalyticsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'record-impressions') {
      const data = job.data as RotatorImpressionJobData;
      await this.analytics.persistImpressions(data);
      this.logger.debug(
        `Recorded ${data.offerIds.length} impressions for cluster ${data.clusterId} window ${data.windowId}`,
      );
      return;
    }

    if (job.name === 'record-view-click') {
      const data = job.data as RotatorViewClickJobData;
      await this.analytics.persistViewOrClick(data);
      this.logger.debug(
        `Recorded ${data.eventType} for offer ${data.offerId} cluster ${data.clusterId} window ${data.windowId}`,
      );
      return;
    }
  }
}
