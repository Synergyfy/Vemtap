import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ClustersService } from './clusters.service';
import { AutoAssignScope } from './dto/cluster.dto';
import {
  CLUSTER_AUTO_ASSIGN_QUEUE,
  ClusterAutoAssignJobData,
} from './cluster-auto-assign.constants';

@Processor(CLUSTER_AUTO_ASSIGN_QUEUE, { concurrency: 1 })
export class ClusterAutoAssignProcessor extends WorkerHost {
  private readonly logger = new Logger(ClusterAutoAssignProcessor.name);

  constructor(private readonly clustersService: ClustersService) {
    super();
  }

  async process(
    job: Job<ClusterAutoAssignJobData, any, string>,
  ): Promise<void> {
    const scope = job.data.scope ?? AutoAssignScope.UNASSIGNED;

    const result = await this.clustersService.runAutoAssign(scope, false);

    this.logger.log(
      `Auto-assign complete [scope=${scope}] candidates=${result.totalCandidates} assigned=${result.assigned} reassigned=${result.reassigned}`,
    );
  }
}
