import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsUUID,
  Min,
  NotEquals,
} from 'class-validator';
import { RewardCategory } from '../entities/reward-template.entity';
import { RewardAudienceType } from '../entities/reward.entity';

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

  @ApiProperty({
    description: 'Total quantity available. Use -1 for infinity.',
  })
  @IsNumber()
  @Min(-1)
  @NotEquals(0)
  totalQuantity: number;

  @ApiProperty()
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    enum: RewardAudienceType,
    default: RewardAudienceType.ALL,
  })
  @IsOptional()
  @IsEnum(RewardAudienceType)
  audienceType?: RewardAudienceType;
}

export class GivePointsDto {
  @ApiProperty({ description: 'Customer unique code' })
  @IsString()
  customerCode: string;

  @ApiPropertyOptional({
    description:
      'Points to award. If omitted and spendingAmount is provided, points are calculated from the active loyalty rule.',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({
    description:
      'Spending amount in currency. If provided without points, points are calculated from the active loyalty rule.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spendingAmount?: number;

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

export class BranchIdParamDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;
}
