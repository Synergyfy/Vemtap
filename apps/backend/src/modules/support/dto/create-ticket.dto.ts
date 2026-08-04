import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketPriority } from '../entities/support-ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ example: 'Issue with Points' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Points Inquiry' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 'I did not receive points for my last visit.' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.NORMAL, required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.NORMAL;
}
