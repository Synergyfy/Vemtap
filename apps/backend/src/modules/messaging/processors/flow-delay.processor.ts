import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FlowEngineService } from '../services/flow-engine.service';

interface FlowDelayJobData {
  executionId: string;
  nodeId: string;
}

@Processor('messaging-flow-delay')
export class FlowDelayProcessor extends WorkerHost {
  private readonly logger = new Logger(FlowDelayProcessor.name);

  constructor(private readonly flowEngine: FlowEngineService) {
    super();
  }

  async process(job: Job<FlowDelayJobData, any, string>): Promise<any> {
    const { executionId, nodeId } = job.data;
    this.logger.log(
      `Processing delayed execution ${executionId} at node ${nodeId}`,
    );

    try {
      await this.flowEngine.resumeExecution(executionId);
    } catch (error) {
      this.logger.error(
        `Failed to resume execution ${executionId}: ${error.message}`,
      );
      throw error;
    }
  }
}
