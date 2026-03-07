import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TicketReplyDto {
  @ApiProperty({ example: 'Checking device logs now.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
