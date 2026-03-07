import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { AgentSupportController } from './agent-support.controller';
import { SupportTicket } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { TicketActivity } from './entities/ticket-activity.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportTicket,
      TicketMessage,
      TicketActivity,
      User,
    ]),
  ],
  controllers: [SupportController, AgentSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
