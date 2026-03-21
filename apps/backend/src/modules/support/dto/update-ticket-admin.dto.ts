import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { TicketStatus } from '../entities/support-ticket.entity';

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: TicketStatus.RESOLVED })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;
}

export class AssignTicketDto {
  @ApiProperty({ description: 'The ID of the agent to assign the ticket to' })
  @IsUUID()
  @IsNotEmpty()
  agentId: string;
}

export class AdminTicketMessageDto {
  @ApiProperty({ description: 'The message content' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
