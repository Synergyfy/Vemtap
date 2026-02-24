import { Module } from '@nestjs/common';
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
import { AutomationRule } from './entities/automation-rule.entity';
import { AutomationLog } from './entities/automation-log.entity';

import { ContactsModule } from '../contacts/contacts.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { MessagingEngineService } from './services/messaging-engine.service';
import { TemplateService } from './services/template.service';
import { ComplianceService } from './services/compliance.service';
import { CreditService } from './services/credit.service';
import { CampaignService } from './services/campaign.service';
import { InboxService } from './services/inbox.service';
import { AnalyticsService } from './services/analytics.service';
import { FlowEngineService } from './services/flow-engine.service';
import { AutomationService } from './services/automation.service';

import { MessagingController } from './controllers/messaging.controller';
import { FlowController } from './controllers/flow.controller';
import { TermiiWebhookController } from './controllers/termii.controller';
import { AutomationsController } from './controllers/automations.controller';

import { TermiiProvider } from './providers/termii.provider';
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
      Business,
      Branch,
      AutomationRule,
      AutomationLog,
    ]),
    HttpModule,
    ContactsModule,
    BusinessesModule,
    SettingsModule,
    SubscriptionsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD');
        const useTls =
          configService.get<string>('REDIS_TLS') === 'true' ||
          host.includes('upstash.io');

        return {
          connection: {
            host,
            port,
            password,
            ...(useTls ? { tls: {} } : {}),
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
    AutomationService,
    TermiiProvider,
    ProviderRouterService,
    BatchSendProcessor,
    FlowDelayProcessor,
    AutomationProcessor,
  ],
  controllers: [
    MessagingController,
    FlowController,
    TermiiWebhookController,
    AutomationsController,
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
    AutomationService,
    TermiiProvider,
    ProviderRouterService,
  ],
})
export class MessagingModule { }
