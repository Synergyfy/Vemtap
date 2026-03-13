import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';

import { MessageTemplate } from './entities/message-template.entity';
import { MessageCampaign } from './entities/message-campaign.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { Message } from './entities/message.entity';
import { MessageLog } from './entities/message-log.entity';
import { Flow } from './entities/flow.entity';
import { FlowExecution } from './entities/flow-execution.entity';
import { FlowTemplate } from './entities/flow-template.entity';
import { FlowTriggerConfig } from './entities/flow-trigger-config.entity';
import { FlowLog } from './entities/flow-log.entity';
import { AutomationRule } from './entities/automation-rule.entity';
import { AutomationLog } from './entities/automation-log.entity';
import { CreditPlan } from './entities/credit-plan.entity';
import { BusinessCredit } from './entities/business-credit.entity';

import { ContactsModule } from '../contacts/contacts.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsModule } from '../payments/payments.module';
import { MailModule } from '../mail/mail.module';
import { BranchesModule } from '../branches/branches.module';

import { MessagingEngineService } from './services/messaging-engine.service';
import { TemplateService } from './services/template.service';
import { ComplianceService } from './services/compliance.service';
import { CreditService } from './services/credit.service';
import { CampaignService } from './services/campaign.service';
import { InboxService } from './services/inbox.service';
import { AnalyticsService } from './services/analytics.service';
import { FlowEngineService } from './services/flow-engine.service';
import { AdminFlowEngineService } from './services/admin-flow-engine.service';
import { AutomationService } from './services/automation.service';
import { MessagingFlowService } from './services/messaging-flow.service';

import { MessagingController } from './controllers/messaging.controller';
import { FlowController } from './controllers/flow.controller';
import { AdminFlowEngineController } from './controllers/admin-flow-engine.controller';
import { TermiiWebhookController } from './controllers/termii.controller';
import { AutomationsController } from './controllers/automations.controller';
import { CreditPlanController } from './controllers/credit-plan.controller';

import { CreditPlanService } from './services/credit-plan.service';
import { TermiiProvider } from './providers/termii.provider';
import { AfricaTalkingProvider } from './providers/africastalking.provider';
import { EmailProvider } from './providers/email.provider';
import { BestBulkSmsProvider } from './providers/bestbulksms.provider';
import { ProviderRouterService } from './services/provider-router.service';
import { BatchSendProcessor } from './processors/batch-send.processor';
import { FlowDelayProcessor } from './processors/flow-delay.processor';
import { AutomationProcessor } from './processors/automation.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageTemplate,
      MessageCampaign,
      ConversationThread,
      Message,
      MessageLog,
      Flow,
      FlowExecution,
      FlowTemplate,
      FlowTriggerConfig,
      FlowLog,
      Business,
      Branch,
      AutomationRule,
      AutomationLog,
      CreditPlan,
      BusinessCredit,
    ]),
    HttpModule,
    ContactsModule,
    forwardRef(() => BusinessesModule),
    SettingsModule,
    forwardRef(() => SubscriptionsModule),
    PaymentsModule,
    MailModule,
    forwardRef(() => BranchesModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD');
        const useTls =
          configService.get<string>('REDIS_TLS') === 'true' ||
          host.includes('upstash.io');

        const isUpstash = host.includes('upstash.io');

        return {
          connection: {
            host,
            port,
            password,
            ...(useTls ? { tls: {} } : {}),
          },
          // Global defaults to reduce Redis requests on Upstash
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: 1000,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'messaging-batch-send',
      },
      {
        name: 'messaging-flow-delay',
      },
      {
        name: 'messaging-automation',
      },
    ),
  ],
  providers: [
    MessagingEngineService,
    TemplateService,
    ComplianceService,
    CreditService,
    CampaignService,
    InboxService,
    AnalyticsService,
    FlowEngineService,
    AdminFlowEngineService,
    AutomationService,
    TermiiProvider,
    AfricaTalkingProvider,
    BestBulkSmsProvider,
    EmailProvider,
    ProviderRouterService,
    BatchSendProcessor,
    FlowDelayProcessor,
    AutomationProcessor,
    CreditPlanService,
    MessagingFlowService,
  ],
  controllers: [
    MessagingController,
    FlowController,
    AdminFlowEngineController,
    TermiiWebhookController,
    AutomationsController,
    CreditPlanController,
  ],
  exports: [
    TypeOrmModule,
    MessagingEngineService,
    TemplateService,
    ComplianceService,
    CreditService,
    CampaignService,
    InboxService,
    AnalyticsService,
    FlowEngineService,
    AdminFlowEngineService,
    AutomationService,
    TermiiProvider,
    AfricaTalkingProvider,
    BestBulkSmsProvider,
    EmailProvider,
    ProviderRouterService,
    MessagingFlowService,
  ],
})
export class MessagingModule {}
