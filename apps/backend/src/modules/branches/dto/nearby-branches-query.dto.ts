import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class NearbyBranchesQueryDto {
  @ApiPropertyOptional({
    description: 'Search radius in meters',
    default: 500,
    example: 500,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  distance?: number;

  @ApiPropertyOptional({
    description: 'Only include branches with active catalogue offers',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  withPromotions?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    default: 20,
    example: 20,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
