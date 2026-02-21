import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreatePlanDto {
    @ApiProperty({ description: 'The name of the plan', example: 'Premium Plan' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Monthly price', example: 50000 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    monthlyPrice?: number;

    @ApiPropertyOptional({ description: 'Quarterly price', example: 140000 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    quarterlyPrice?: number;

    @ApiPropertyOptional({ description: 'Yearly price', example: 500000 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    yearlyPrice?: number;

    @ApiPropertyOptional({ description: 'Currency', example: 'NGN' })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiPropertyOptional({ description: 'Whether the plan is free', example: false })
    @IsBoolean()
    @IsOptional()
    isFree?: boolean;

    @ApiPropertyOptional({ description: 'Free duration in days (null for unlimited)', example: 30 })
    @IsNumber()
    @IsOptional()
    freeDurationDays?: number;

    @ApiPropertyOptional({ description: 'Maximum team members limit (null for unlimited)', example: 5 })
    @IsNumber()
    @IsOptional()
    teamMembersLimit?: number;

    @ApiPropertyOptional({ description: 'Loyalty programs limit (null for unlimited)', example: 10 })
    @IsNumber()
    @IsOptional()
    loyaltyLimit?: number;

    @ApiPropertyOptional({ description: 'Tags/Devices limit (null for unlimited)', example: 100 })
    @IsNumber()
    @IsOptional()
    tagsLimit?: number;

    @ApiPropertyOptional({ description: 'Level of analytics', example: 'advanced' })
    @IsString()
    @IsOptional()
    analyticsLevel?: string;

    @ApiPropertyOptional({ description: 'Is plan currently active?', example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Plan description', example: 'Access to premium features.' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Is this plan marked as popular?', example: true })
    @IsBoolean()
    @IsOptional()
    isPopular?: boolean;
}
