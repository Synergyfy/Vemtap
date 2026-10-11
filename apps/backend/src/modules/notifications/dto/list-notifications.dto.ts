import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListNotificationsDto {
  @ApiPropertyOptional({
    description: 'Max rows to return. Defaults to 50, capped at 200.',
    minimum: 1,
    maximum: 200,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Return rows older than this ISO timestamp — the createdAt of the last row you already have.',
    example: '2026-01-15T09:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  before?: string;
}
