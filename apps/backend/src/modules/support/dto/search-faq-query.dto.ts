import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchFaqQueryDto {
  @ApiPropertyOptional({
    description: 'Search query keyword for support FAQs',
    example: 'subscription',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
  )
  search?: string;
}
