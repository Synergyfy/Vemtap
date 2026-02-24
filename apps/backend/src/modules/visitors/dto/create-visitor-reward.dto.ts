import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateVisitorRewardDto {
  @ApiPropertyOptional({
    description: 'Branch ID. Must be a valid UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ description: 'Reward name', example: 'Free Coffee' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Reward description',
    example: 'Get a free coffee on us',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Point cost to redeem', example: 500 })
  @IsNumber()
  pointCost: number;

  @ApiPropertyOptional({
    description: 'Reward type',
    example: 'free_item',
  })
  @IsString()
  @IsOptional()
  rewardType?: string;

  @ApiPropertyOptional({ description: 'Value amount', example: 5.0 })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({
    description: 'Days until it expires after redemption',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  validityDays?: number;

  @ApiPropertyOptional({
    description: 'Usage limit per user',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  usageLimitPerUser?: number;
}
