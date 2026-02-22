import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AutomationService } from '../services/automation.service';
import { AutomationTriggerType } from '../entities/automation-rule.entity';

@Injectable()
export class AutomationListener {
  private readonly logger = new Logger(AutomationListener.name);

  constructor(private readonly automationService: AutomationService) {}

  @OnEvent('visitor.captured')
  async handleVisitorCaptured(payload: any) {
    // Payload should contain { visitorId, branchId, contactId, ... }
    if (!payload.branchId) return;

    await this.automationService.handleEvent(
      AutomationTriggerType.VISITOR_CAPTURED,
      payload.branchId,
      payload,
    );
  }

  @OnEvent('survey.completed')
  async handleSurveyCompleted(payload: any) {
    if (!payload.branchId) return;

    await this.automationService.handleEvent(
      AutomationTriggerType.SURVEY_COMPLETED,
      payload.branchId,
      payload,
    );
  }

  @OnEvent('session.abandoned')
  async handleAbandonedSession(payload: any) {
    if (!payload.branchId) return;

    await this.automationService.handleEvent(
      AutomationTriggerType.ABANDONED_SESSION,
      payload.branchId,
      payload,
    );
  }
}
