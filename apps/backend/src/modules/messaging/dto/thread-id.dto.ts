import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ThreadIdDto {
  @ApiProperty({
    description: 'Conversation thread UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'The thread ID must be a valid UUID v4' })
  @IsNotEmpty()
  threadId: string;
}
