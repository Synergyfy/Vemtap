import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
}
