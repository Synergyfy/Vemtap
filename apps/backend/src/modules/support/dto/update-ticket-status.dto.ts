import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TicketStatus } from '../entities/support-ticket.entity';

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: TicketStatus.IN_PROGRESS })
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
