import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
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

  @ApiProperty({
    description: 'Features included in the plan',
    example: ['Analytics', 'Unlimited Messages'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  features: string[];

  @ApiPropertyOptional({ description: 'Currency', example: 'NGN' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Whether the plan is free',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({
    description: 'Trial duration in days (default 30)',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  trialDurationDays?: number;

  @ApiPropertyOptional({ description: 'Is messaging enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  messagingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'SMS credits', example: 100 })
  @IsNumber()
  @IsOptional()
  smsCredits?: number;

  @ApiPropertyOptional({ description: 'WhatsApp credits', example: 50 })
  @IsNumber()
  @IsOptional()
  whatsappCredits?: number;

  @ApiPropertyOptional({ description: 'Email credits', example: 1000 })
  @IsNumber()
  @IsOptional()
  emailCredits?: number;

  @ApiPropertyOptional({
    description: 'Is team members management enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  teamMembersEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum team members limit (null for unlimited)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  teamMembersLimit?: number;

  @ApiPropertyOptional({
    description: 'Loyalty programs limit (null for unlimited)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  loyaltyLimit?: number;

  @ApiPropertyOptional({
    description: 'Is loyalty management enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  loyaltyEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Is branches enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  branchesEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Branches limit (null for unlimited)',
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  branchLimit?: number;

  @ApiPropertyOptional({ description: 'Is analytics enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  analyticsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Level of analytics',
    example: 'advanced',
  })
  @IsString()
  @IsOptional()
  analyticsLevel?: string;

  @ApiPropertyOptional({ description: 'Is catalogue enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  catalogueEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum catalogue items limit (null for unlimited)',
    example: 50,
  })
  @IsNumber()
  @IsOptional()
  maxCatalogueItems?: number;

  @ApiPropertyOptional({
    description: 'Maximum catalogue categories limit (null for unlimited)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  maxCatalogueCategories?: number;

  @ApiPropertyOptional({
    description: 'Maximum catalogue offers limit (null for unlimited)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  maxCatalogueOffers?: number;

  @ApiPropertyOptional({
    description: 'Is automations enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  automationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum automations limit (null or -1 for unlimited)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  maxAutomations?: number;

  @ApiPropertyOptional({
    description: 'Is plan currently active?',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Access to premium features.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'QR Thrive plan ID to link to',
    example: 'plan_123',
  })
  @IsString()
  @IsOptional()
  qrThrivePlanId?: string;

  @ApiPropertyOptional({
    description: 'Is this plan marked as popular?',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  // --- New Permission Columns ---

  @ApiPropertyOptional({
    description: 'Is inventory counting enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  inventoryEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Inventory counting limit (null for unlimited)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  inventoryLimit?: number;

  @ApiPropertyOptional({
    description: 'Is POS terminal enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  posEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'POS terminal limit (null for unlimited)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  posTerminalLimit?: number;

  @ApiPropertyOptional({
    description: 'Is visitors feed enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  visitorsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Is in-app chat enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  inAppChatEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Is forms module enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  formsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Forms limit (null for unlimited)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  formsLimit?: number;

  @ApiPropertyOptional({
    description: 'Is business QR enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  businessQrEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Is marketing kit enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  marketingKitEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Marketing kit assets limit (null for unlimited)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  marketingKitLimit?: number;

  @ApiPropertyOptional({
    description: 'Is discovery network enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  discoveryEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Is staff roles management enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  staffRolesEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Staff roles limit (null for unlimited)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  staffRolesLimit?: number;

  @ApiPropertyOptional({
    description: 'Is activity log enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  activityLogEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Is QR codes module enabled?',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  qrCodesEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'QR codes limit (null for unlimited)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  qrCodesLimit?: number;

  // --- AI Copilot ---

  @ApiPropertyOptional({
    description: 'Is AI Copilot enabled on this plan?',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  aiCopilotEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Monthly AI Copilot credit allowance. 0 = disabled. -1 = unlimited.',
    example: 50,
  })
  @IsNumber()
  @IsOptional()
  aiCredits?: number;
}
