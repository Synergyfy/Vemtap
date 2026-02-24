import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AutomationService } from '../services/automation.service';
import { AutomationTriggerDto } from '../dto/automation-rule.dto';

interface AutomationJobData {
  ruleId: string;
  triggerDto: AutomationTriggerDto;
}

@Processor('messaging-automation')
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(private readonly automationService: AutomationService) {
    super();
  }

  async process(job: Job<AutomationJobData, any, string>): Promise<any> {
    const { ruleId, triggerDto } = job.data;
    this.logger.log(
      `Processing delayed automation rule ${ruleId} for contact ${triggerDto.contactId}`,
    );

    try {
      await this.automationService.executeRule(ruleId, triggerDto);
    } catch (error: any) {
      this.logger.error(
        `Failed to execute delayed rule ${ruleId}: ${error.message}`,
      );
      throw error;
    }
  }
}
