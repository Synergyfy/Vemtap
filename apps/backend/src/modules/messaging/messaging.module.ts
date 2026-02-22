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

import { ContactsModule } from '../contacts/contacts.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SettingsModule } from '../settings/settings.module';

import { MessagingEngineService } from './services/messaging-engine.service';
import { TemplateService } from './services/template.service';
import { ComplianceService } from './services/compliance.service';
import { CreditService } from './services/credit.service';
import { CampaignService } from './services/campaign.service';
import { InboxService } from './services/inbox.service';
import { AnalyticsService } from './services/analytics.service';
import { FlowEngineService } from './services/flow-engine.service';
import { MessagingController } from './controllers/messaging.controller';
import { FlowController } from './controllers/flow.controller';
import { TermiiWebhookController } from './controllers/termii.controller';
import { TermiiProvider } from './providers/termii.provider';
import { ProviderRouterService } from './services/provider-router.service';
import { BatchSendProcessor } from './processors/batch-send.processor';
import { FlowDelayProcessor } from './processors/flow-delay.processor';

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
    ]),
    HttpModule,
    ContactsModule,
    BusinessesModule,
    SettingsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'messaging-batch-send',
    }, {
      name: 'messaging-flow-delay',
    }),
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
    TermiiProvider,
    ProviderRouterService,
    BatchSendProcessor,
    FlowDelayProcessor,
  ],
  controllers: [
    MessagingController,
    FlowController,
    TermiiWebhookController,
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
    TermiiProvider,
    ProviderRouterService,
  ],
})
export class MessagingModule {}
