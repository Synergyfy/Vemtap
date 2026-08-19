import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SupportSessionQueryDto {
  @ApiPropertyOptional({
    description: 'Conversation or bot session identifier',
    example: 'session-xyz-123',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
  )
  sessionId?: string;
}
