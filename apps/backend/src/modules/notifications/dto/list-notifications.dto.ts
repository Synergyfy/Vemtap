import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListNotificationsDto {
  /**
   * Page number, for the business feed which pages rather than cursors.
   *
   * The personal list is cursor-based (`before`), and a venue's feed is long
   * enough that a page number is friendlier than paging by hand — the app
   * shows a numbered feed, not "load more".
   */
  @ApiPropertyOptional({
    description: 'Page number for the business feed. Defaults to 1.',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

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
