import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindPlansQueryDto {
  @ApiPropertyOptional({
    description: 'Filter only active plans',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  onlyActive?: boolean;
}
