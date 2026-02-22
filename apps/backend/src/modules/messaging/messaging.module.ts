import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';

import { MessageTemplate } from './entities/message-template.entity';
import { MessageCampaign } from './entities/message-campaign.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { Message } from './entities/message.entity';
import { MessageLog } from './entities/message-log.entity';

import { ContactsModule } from '../contacts/contacts.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SettingsModule } from '../settings/settings.module';

import { MessagingEngineService } from './services/messaging-engine.service';
import { SmsService } from './services/sms.service';
import { WhatsappService } from './services/whatsapp.service';
import { EmailService } from './services/email.service';
import { TemplateService } from './services/template.service';
import { ComplianceService } from './services/compliance.service';
import { CreditService } from './services/credit.service';
import { CampaignService } from './services/campaign.service';
import { InboxService } from './services/inbox.service';
import { AnalyticsService } from './services/analytics.service';
import { MessagingController } from './controllers/messaging.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MessageTemplate,
            MessageCampaign,
            ConversationThread,
            Message,
            MessageLog,
            Business,
            Branch,
        ]),
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
        }),
    ],
    providers: [
        MessagingEngineService,
        SmsService,
        WhatsappService,
        EmailService,
        TemplateService,
        ComplianceService,
        CreditService,
        CampaignService,
        InboxService,
        AnalyticsService,
    ],
    controllers: [MessagingController],
    exports: [
        TypeOrmModule,
        MessagingEngineService,
        SmsService,
        WhatsappService,
        EmailService,
        TemplateService,
        ComplianceService,
        CreditService,
        CampaignService,
        InboxService,
        AnalyticsService,
    ],
})
export class MessagingModule { }
