import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsDateString, IsUUID, Min } from 'class-validator';
import { RewardCategory } from '../entities/reward-template.entity';

export class CreateRewardTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  pointsRequired: number;

  @ApiProperty({ enum: RewardCategory })
  @IsEnum(RewardCategory)
  category: RewardCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];
}

export class CreateRewardDto extends CreateRewardTemplateDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  totalQuantity: number;

  @ApiProperty()
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;
}

export class GivePointsDto {
  @ApiProperty({ description: 'Customer unique code' })
  @IsString()
  customerCode: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  points: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;
}

export class GeneratePointCodeDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty()
  @IsUUID()
  businessId: string;
}

export class UsePointCodeDto {
  @ApiProperty()
  @IsString()
  code: string;
}

export class GenerateRedemptionCodeDto {
  @ApiProperty()
  @IsUUID()
  rewardId: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;
}

export class RedeemRewardDto {
  @ApiProperty()
  @IsString()
  code: string;
}
