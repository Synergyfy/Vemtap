import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { User } from '../users/entities/user.entity';
import { Visit } from '../visitors/entities/visit.entity';

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
import { ChatCategory } from './entities/chat-category.entity';
import { CreditPlan } from './entities/credit-plan.entity';
import { BusinessCredit } from './entities/business-credit.entity';
import { BusinessCreditWallet } from './entities/business-credit-wallet.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { Segment } from '../contacts/entities/segment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

import { ContactsModule } from '../contacts/contacts.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsModule } from '../payments/payments.module';
import { MailModule } from '../mail/mail.module';
import { BranchesModule } from '../branches/branches.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

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
import { ChatSettingsService } from './services/chat-settings.service';
import { MessagingHelperService } from './services/messaging-helper.service';

import { MessagingController } from './controllers/messaging.controller';
import { CustomerMessagingController } from './controllers/customer-messaging.controller';
import { ChatSettingsController } from './controllers/chat-settings.controller';
import { FlowController } from './controllers/flow.controller';
import { AdminFlowEngineController } from './controllers/admin-flow-engine.controller';
import { AutomationsController } from './controllers/automations.controller';
import { CreditPlanController } from './controllers/credit-plan.controller';
import { CreditController } from './controllers/credit.controller';

import { CreditPlanService } from './services/credit-plan.service';
import { TwilioProvider } from './providers/twilio.provider';
import { EmailProvider } from './providers/email.provider';
import { BestBulkSmsProvider } from './providers/bestbulksms.provider';
import { InHouseProvider } from './providers/inhouse.provider';
import { ProviderRouterService } from './services/provider-router.service';
import { BatchSendProcessor } from './processors/batch-send.processor';
import { IndividualSendProcessor } from './processors/individual-send.processor';
import { FlowDelayProcessor } from './processors/flow-delay.processor';
import { AutomationProcessor } from './processors/automation.processor';
import { TwilioWebhookController } from './controllers/twilio.controller';

import { MessagingGateway } from './messaging.gateway';
import { JwtModule } from '@nestjs/jwt';

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
      Contact,
      User,
      Visit,
      AutomationRule,
      AutomationLog,
      ChatCategory,
      CreditPlan,
      BusinessCredit,
      BusinessCreditWallet,
      CreditTransaction,
      Segment,
      Subscription,
    ]),
    HttpModule,
    ContactsModule,
    forwardRef(() => BusinessesModule),
    SettingsModule,
    forwardRef(() => SubscriptionsModule),
    PaymentsModule,
    MailModule,
    forwardRef(() => BranchesModule),
    NotificationsModule,
    forwardRef(() => LoyaltyModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') as any,
        },
      }),
      inject: [ConfigService],
    }),
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
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
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
        name: 'messaging-individual-send',
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
    TwilioProvider,
    BestBulkSmsProvider,
    EmailProvider,
    InHouseProvider,
    ProviderRouterService,
    BatchSendProcessor,
    IndividualSendProcessor,
    FlowDelayProcessor,
    AutomationProcessor,
    CreditPlanService,
    MessagingFlowService,
    ChatSettingsService,
    MessagingHelperService,
    MessagingGateway,
  ],
  controllers: [
    MessagingController,
    CustomerMessagingController,
    ChatSettingsController,
    FlowController,
    AdminFlowEngineController,
    TwilioWebhookController,
    AutomationsController,
    CreditPlanController,
    CreditController,
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
    TwilioProvider,
    BestBulkSmsProvider,
    EmailProvider,
    InHouseProvider,
    ProviderRouterService,
    MessagingFlowService,
    MessagingHelperService,
    MessagingGateway,
  ],
})
export class MessagingModule {}
