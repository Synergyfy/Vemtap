import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MessageTemplate } from './entities/message-template.entity';
import { MessageCampaign } from './entities/message-campaign.entity';
import { ConversationThread } from './entities/conversation-thread.entity';
import { Message } from './entities/message.entity';
import { MessageLog } from './entities/message-log.entity';

import { ContactsModule } from '../contacts/contacts.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MessageTemplate,
            MessageCampaign,
            ConversationThread,
            Message,
            MessageLog,
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
    providers: [],
    controllers: [],
    exports: [TypeOrmModule],
})
export class MessagingModule { }
