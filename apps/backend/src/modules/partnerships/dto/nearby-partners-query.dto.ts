import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyPartnersQueryDto {
  @ApiProperty({
    example: 'd9b2d63d-4c3e-4f30-8025-06be521b191a',
    description: 'The ID of the branch to search nearby partners for',
  })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Search radius in meters',
    default: 10000,
    example: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  distance?: number = 10000;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
