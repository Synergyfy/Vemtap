import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
} from 'class-validator';

export class ReplyDto {
  @ApiProperty({ example: 'Hello, how can I help you?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'uuid-of-message-being-replied-to' })
  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @ApiPropertyOptional({ example: { rewardId: 'uuid' } })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
