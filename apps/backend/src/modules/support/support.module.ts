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
import { SupportKnowledge, BotInteraction } from './entities/support-bot.entity';
import { BotConversationContext } from './entities/conversation-context.entity';
import { User } from '../users/entities/user.entity';
import { BusinessCreditWallet } from '../messaging/entities/business-credit-wallet.entity';

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
  ],
  controllers: [SupportController, AgentSupportController],
  providers: [SupportService, SupportBotService, BotContextService, ConversationContextService],
  exports: [SupportService, SupportBotService, BotContextService, ConversationContextService],
})
export class SupportModule {}
