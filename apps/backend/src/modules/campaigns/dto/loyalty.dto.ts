import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';

export class UpdateLoyaltyRuleDto {
  @ApiProperty({
    description: 'The type of rule (visit or spending)',
    example: 'visit',
    required: false,
  })
  @IsString()
  @IsOptional()
  ruleType?: string;

  @ApiProperty({
    description: 'Amount to spend to earn points',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  spendingBaseAmount?: number;

  @ApiProperty({
    description: 'Points earned per base spend amount',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  spendingBasePoints?: number;

  @ApiProperty({
    description: 'Points earned per visit',
    example: 50,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  visitPoints?: number;

  @ApiProperty({
    description: 'Hours to wait between visit points',
    example: 24,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  visitCooldownHours?: number;

  @ApiProperty({
    description: 'First visit bonus points',
    example: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  firstVisitBonus?: number;

  @ApiProperty({
    description: 'Birthday bonus points',
    example: 500,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  birthdayBonus?: number;

  @ApiProperty({
    description: 'Referral bonus points',
    example: 200,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  referralBonus?: number;

  @ApiProperty({
    description: 'Toggle rule active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateRewardDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch_001',
    required: false,
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ description: 'Reward name', example: 'Free Coffee' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Reward description',
    example: 'Get a free coffee on us',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Point cost to redeem', example: 500 })
  @IsNumber()
  pointCost: number;

  @ApiProperty({
    description: 'Reward type',
    example: 'free_item',
    required: false,
  })
  @IsString()
  @IsOptional()
  rewardType?: string;

  @ApiProperty({ description: 'Value amount', example: 5.0, required: false })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiProperty({
    description: 'Days until it expires after redemption',
    example: 30,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  validityDays?: number;

  @ApiProperty({
    description: 'Usage limit per user',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  usageLimitPerUser?: number;

  @ApiProperty({
    description: 'Image URLs array',
    example: ['https://...'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  imageUrls?: string[];

  @ApiProperty({
    description: 'Total rewards available for redemption',
    example: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  totalAvailable?: number;

  @ApiProperty({
    description: 'Toggle reward active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRewardDto extends PartialType(CreateRewardDto) {}

export class CreateLoyaltyTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Cafe Welcome' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template description', example: '...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Loyalty rules', type: UpdateLoyaltyRuleDto })
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateLoyaltyRuleDto)
  rules: UpdateLoyaltyRuleDto;

  @ApiProperty({ description: 'Rewards to include', type: [CreateRewardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRewardDto)
  rewards: CreateRewardDto[];

  @ApiProperty({ description: 'Status', example: 'published', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateLoyaltyTemplateDto extends PartialType(CreateLoyaltyTemplateDto) {}

export class PointEarnRequestDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch_001',
    required: false,
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ description: 'The user ID', example: 'user_001' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount spent', example: 45.5, required: false })
  @IsNumber()
  @IsOptional()
  amountSpent?: number;

  @ApiProperty({ description: 'Is a visit', example: true })
  @IsBoolean()
  isVisit: boolean;

  @ApiProperty({
    description: 'Transaction metadata',
    example: { platform: 'pos' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RewardRedeemRequestDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch_001',
    required: false,
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ description: 'Loyalty profile ID', example: 'lp_123456' })
  @IsString()
  loyaltyProfileId: string;

  @ApiProperty({ description: 'Reward ID', example: 'rew_123456' })
  @IsString()
  rewardId: string;
}

export class EarnPointsDto extends PointEarnRequestDto {}
export class RedeemRewardDto extends RewardRedeemRequestDto {}
export class CreateLoyaltyRewardDto extends CreateRewardDto {}

export class VerifyRedemptionDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch_001',
    required: false,
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ description: 'Redemption code', example: '123456789' })
  @IsString()
  code: string;
}

export class GenerateRedemptionCodeDto {
  @ApiProperty({ description: 'The reward ID', example: 'rew_123' })
  @IsString()
  rewardId: string;

  @ApiProperty({ description: 'Loyalty profile ID (Optional)', example: 'lp_123', required: false })
  @IsString()
  @IsOptional()
  loyaltyProfileId?: string;

  @ApiProperty({ description: 'Branch ID', example: 'branch_001', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class ClaimCodeDto {
  @ApiProperty({ description: 'The 9-digit code', example: '123456789' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Branch ID', example: 'branch_001', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class BranchQueryDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch_001',
    required: false,
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    description: 'Fetch for all branches (Owner only)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  allBranches?: boolean;

  @ApiProperty({
    description: 'Business ID (Admin only)',
    example: 'bus_001',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessId?: string;
}
