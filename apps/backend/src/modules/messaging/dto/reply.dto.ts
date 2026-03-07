import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyDto {
  @ApiProperty({ example: 'Hello, how can I help you?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
