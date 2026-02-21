import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdateLoyaltyRuleDto {
    @ApiProperty({ description: 'Amount to spend to earn points', example: 10, required: false })
    @IsNumber()
    @IsOptional()
    spendingBaseAmount?: number;

    @ApiProperty({ description: 'Points earned per base spend amount', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    spendingBasePoints?: number;

    @ApiProperty({ description: 'Points earned per visit', example: 50, required: false })
    @IsNumber()
    @IsOptional()
    visitPoints?: number;

    @ApiProperty({ description: 'Hours to wait between visit points', example: 24, required: false })
    @IsNumber()
    @IsOptional()
    visitCooldownHours?: number;

    @ApiProperty({ description: 'First visit bonus points', example: 100, required: false })
    @IsNumber()
    @IsOptional()
    firstVisitBonus?: number;

    @ApiProperty({ description: 'Birthday bonus points', example: 500, required: false })
    @IsNumber()
    @IsOptional()
    birthdayBonus?: number;

    @ApiProperty({ description: 'Referral bonus points', example: 200, required: false })
    @IsNumber()
    @IsOptional()
    referralBonus?: number;

    @ApiProperty({ description: 'Toggle rule active', example: true, required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class CreateRewardDto {
    @ApiProperty({ description: 'Reward name', example: 'Free Coffee' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Reward description', example: 'Get a free coffee on us', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Point cost to redeem', example: 500 })
    @IsNumber()
    pointCost: number;

    @ApiProperty({ description: 'Reward type', example: 'free_item', required: false })
    @IsString()
    @IsOptional()
    rewardType?: string;

    @ApiProperty({ description: 'Value amount', example: 5.00, required: false })
    @IsNumber()
    @IsOptional()
    value?: number;

    @ApiProperty({ description: 'Days until it expires after redemption', example: 30, required: false })
    @IsNumber()
    @IsOptional()
    validityDays?: number;

    @ApiProperty({ description: 'Usage limit per user', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    usageLimitPerUser?: number;
}

export class UpdateRewardDto extends PartialType(CreateRewardDto) { }

export class PointEarnRequestDto {
    @ApiProperty({ description: 'The user ID', example: 'user_001' })
    @IsString()
    userId: string;

    @ApiProperty({ description: 'Amount spent', example: 45.50, required: false })
    @IsNumber()
    @IsOptional()
    amountSpent?: number;

    @ApiProperty({ description: 'Is a visit', example: true })
    @IsBoolean()
    isVisit: boolean;

    @ApiProperty({ description: 'Transaction metadata', example: { platform: 'pos' }, required: false })
    @IsObject()
    @IsOptional()
    metadata?: any;
}

export class RewardRedeemRequestDto {
    @ApiProperty({ description: 'Loyalty profile ID', example: 'lp_123456' })
    @IsString()
    loyaltyProfileId: string;

    @ApiProperty({ description: 'Reward ID', example: 'rew_123456' })
    @IsString()
    rewardId: string;
}

export class VerifyRedemptionDto {
    @ApiProperty({ description: 'Redemption code', example: 'A1B2C3D4' })
    @IsString()
    code: string;
}
