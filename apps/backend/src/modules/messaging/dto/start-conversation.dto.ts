import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ThreadSubjectType } from '../entities/conversation-thread.entity';

export class StartConversationDto {
  @ApiProperty({ example: 'uuid-branch' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'Hello, I have a question about your services.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    enum: ThreadSubjectType,
    description:
      'Latest conversation context (the thread classifies under DEAL/BOOKING etc.)',
  })
  @IsOptional()
  @IsEnum(ThreadSubjectType)
  subjectType?: ThreadSubjectType;

  @ApiPropertyOptional({
    example: 'uuid-of-claim',
    description: 'Linked claim when the chat was opened from a deal pass',
  })
  @IsOptional()
  @IsUUID()
  claimId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-order',
    description: 'Linked order when the chat was opened from an order',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
