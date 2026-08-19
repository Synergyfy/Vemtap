import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';

export class FindMarketingAssetsQueryDto extends BranchFilterDto {
  @ApiPropertyOptional({
    description: 'Filter marketing assets by template or asset type',
    example: 'flyer',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
  )
  type?: string;
}
