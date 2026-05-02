import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportBotService } from './support-bot.service';
import { BotContextService } from './bot-context.service';
import { ConversationContextService } from './conversation-context.service';
import { SupportController } from './support.controller';
import { AgentSupportController } from './agent-support.controller';
import { SupportTicket } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { TicketActivity } from './entities/ticket-activity.entity';
import {
  SupportKnowledge,
  BotInteraction,
} from './entities/support-bot.entity';
import { BotConversationContext } from './entities/conversation-context.entity';
import { User } from '../users/entities/user.entity';
import { BusinessCreditWallet } from '../messaging/entities/business-credit-wallet.entity';

import { MessagingModule } from '../messaging/messaging.module';
import { SupportGateway } from './support.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportTicket,
      TicketMessage,
      TicketActivity,
      SupportKnowledge,
      BotInteraction,
      BotConversationContext,
      User,
      BusinessCreditWallet,
    ]),
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
  ],
  controllers: [SupportController, AgentSupportController],
  providers: [
    SupportService,
    SupportBotService,
    BotContextService,
    ConversationContextService,
    SupportGateway,
  ],
  exports: [
    SupportService,
    SupportBotService,
    BotContextService,
    ConversationContextService,
    SupportGateway,
  ],
})
export class SupportModule {}
