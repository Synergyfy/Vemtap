import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class SavePlanPermissionsDto {
  // --- Existing Permission Columns ---

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

  @ApiPropertyOptional({ description: 'Is team members enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  teamMembersEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Team members limit (null for unlimited)', example: 5 })
  @IsNumber()
  @IsOptional()
  teamMembersLimit?: number;

  @ApiPropertyOptional({ description: 'Is loyalty enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  loyaltyEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Loyalty programs limit (null for unlimited)', example: 10 })
  @IsNumber()
  @IsOptional()
  loyaltyLimit?: number;

  @ApiPropertyOptional({ description: 'Is branches enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  branchesEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Branches limit (null for unlimited)', example: 3 })
  @IsNumber()
  @IsOptional()
  branchLimit?: number;

  @ApiPropertyOptional({ description: 'Is analytics enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  analyticsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Analytics level', example: 'advanced' })
  @IsString()
  @IsOptional()
  analyticsLevel?: string;

  @ApiPropertyOptional({ description: 'Is catalogue enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  catalogueEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Max catalogue items (null for unlimited)', example: 50 })
  @IsNumber()
  @IsOptional()
  maxCatalogueItems?: number;

  @ApiPropertyOptional({ description: 'Max catalogue categories (null for unlimited)', example: 10 })
  @IsNumber()
  @IsOptional()
  maxCatalogueCategories?: number;

  @ApiPropertyOptional({ description: 'Max catalogue offers (null for unlimited)', example: 10 })
  @IsNumber()
  @IsOptional()
  maxCatalogueOffers?: number;

  @ApiPropertyOptional({ description: 'Is automations enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  automationsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Max automations (null for unlimited)', example: 5 })
  @IsNumber()
  @IsOptional()
  maxAutomations?: number;

  // --- New Permission Columns ---

  @ApiPropertyOptional({ description: 'Is inventory counting enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  inventoryEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Inventory counting limit (null for unlimited)', example: 10 })
  @IsNumber()
  @IsOptional()
  inventoryLimit?: number;

  @ApiPropertyOptional({ description: 'Is POS terminal enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  posEnabled?: boolean;

  @ApiPropertyOptional({ description: 'POS terminal limit (null for unlimited)', example: 1 })
  @IsNumber()
  @IsOptional()
  posTerminalLimit?: number;

  @ApiPropertyOptional({ description: 'Is visitors feed enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  visitorsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Is in-app chat enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  inAppChatEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Is forms module enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  formsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Forms limit (null for unlimited)', example: 5 })
  @IsNumber()
  @IsOptional()
  formsLimit?: number;

  @ApiPropertyOptional({ description: 'Is business QR enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  businessQrEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Is marketing kit enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  marketingKitEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Marketing kit assets limit (null for unlimited)', example: 10 })
  @IsNumber()
  @IsOptional()
  marketingKitLimit?: number;

  @ApiPropertyOptional({ description: 'Is discovery network enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  discoveryEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Is staff roles management enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  staffRolesEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Staff roles limit (null for unlimited)', example: 5 })
  @IsNumber()
  @IsOptional()
  staffRolesLimit?: number;

  @ApiPropertyOptional({ description: 'Is activity log enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  activityLogEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Is QR codes module enabled?', example: false })
  @IsBoolean()
  @IsOptional()
  qrCodesEnabled?: boolean;

  @ApiPropertyOptional({ description: 'QR codes limit (null for unlimited)', example: 5 })
  @IsNumber()
  @IsOptional()
  qrCodesLimit?: number;
}
