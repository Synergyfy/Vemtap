import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: 'Free Coffee' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Get a free coffee after 10 purchases', required: false })
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

  @ApiProperty({ example: 10.00, required: false })
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
