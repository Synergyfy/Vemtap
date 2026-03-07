import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateLoyaltyRewardDto {
  @ApiPropertyOptional({
    description: 'Branch ID for this reward',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiProperty({ example: 'Free Coffee' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Get a free coffee after 10 purchases',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 500 })
  @IsNotEmpty()
  @IsNumber()
  pointCost: number;

  @ApiProperty({ example: 'discount', required: false })
  @IsOptional()
  @IsString()
  rewardType?: string;

  @ApiProperty({ example: 10.0, required: false })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  validityDays?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
