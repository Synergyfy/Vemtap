import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { PosAutoPrintTrigger } from '../pos-settings.types';

export class PosPermissionPolicyDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  voidRequiresPin?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  refundRequiresPin?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  reprintRequiresPin?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  drawerOpenRequiresPin?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  discountOverrideRequiresPin?: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Percent, 0–100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountMaxPercent?: number;

  @ApiPropertyOptional({ example: 10000, description: 'Naira; 0 means no cap' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountMaxAmount?: number;

  @ApiPropertyOptional({ example: 5, description: '0 disables the idle lock' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  idleLockMinutes?: number;
}

export class PosTransferRailDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'Wema Bank' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bankName?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'accountNumber must be 10 digits' })
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Urban Grill Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accountName?: string;
}

export class PosHouseTabDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number;
}

export class PosTenderRailsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  cash?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  card?: boolean;

  @ApiPropertyOptional({ type: PosTransferRailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosTransferRailDto)
  transfer?: PosTransferRailDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  oneTap?: boolean;

  @ApiPropertyOptional({ type: PosHouseTabDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosHouseTabDto)
  houseTab?: PosHouseTabDto;
}

/**
 * Partial update of the POS settings. Only the fields sent change; nested
 * `permissions` and `tenderRails` merge field by field too.
 */
export class UpdatePosSettingsDto {
  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: 'Thank you for dining with us' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  receiptHeader?: string;

  @ApiPropertyOptional({ example: 'See you again soon' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  receiptFooter?: string;

  @ApiPropertyOptional({ example: '12 Aminu Kano Crescent, Wuse 2, Abuja' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  receiptAddress?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  receiptPhone?: string;

  @ApiPropertyOptional({ enum: [58, 80], example: 80 })
  @IsOptional()
  @IsIn([58, 80])
  receiptWidth?: 58 | 80;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoPrintReceipt?: boolean;

  @ApiPropertyOptional({
    isArray: true,
    enum: ['sale', 'refund', 'kitchen'],
    example: ['sale'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['sale', 'refund', 'kitchen'], { each: true })
  autoPrintOn?: PosAutoPrintTrigger[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  printKitchenChits?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @ApiPropertyOptional({ example: '12345678-0001' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  tin?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @ApiPropertyOptional({ example: 7.5, description: 'Percent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ example: 'VAT' })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  taxLabel?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  pricesIncludeTax?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  takeawayVatExempt?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  serviceChargeEnabled?: boolean;

  @ApiPropertyOptional({ example: 5, description: 'Percent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  serviceChargeRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  serviceChargeWaivable?: boolean;

  @ApiPropertyOptional({ example: 300, description: 'Naira, takeaway only' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  packagingFee?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  packagingAutoApply?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  selfOrderingEnabled?: boolean;

  @ApiPropertyOptional({ example: 50000, description: 'Naira; 0 means no cap' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQrOrderValue?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Temporarily stop accepting guest QR orders',
  })
  @IsOptional()
  @IsBoolean()
  rushPause?: boolean;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  tableCount?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  offlineBufferLimit?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(3600)
  autoSyncIntervalSec?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  defaultPrepMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  loyaltyEnabled?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  loyaltyRedeemThreshold?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  lowStockAlerts?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  dailySalesSummary?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  newOrderAlert?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  staffActivityAlerts?: boolean;

  @ApiPropertyOptional({ type: PosPermissionPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosPermissionPolicyDto)
  permissions?: PosPermissionPolicyDto;

  @ApiPropertyOptional({ type: PosTenderRailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosTenderRailsDto)
  tenderRails?: PosTenderRailsDto;
}

/** Full settings as returned: every field resolved against the defaults. */
export class PosSettingsResponseDto extends UpdatePosSettingsDto {}

export class PosSettingsSummaryDto {
  @ApiProperty({ example: 'VAT 7.5%', nullable: true })
  taxLabel: string | null;

  @ApiProperty({ example: 'Service 5%', nullable: true })
  serviceChargeLabel: string | null;

  @ApiProperty({ example: 80 })
  receiptWidth: number;

  @ApiProperty({ example: 4, description: 'Register sessions open right now' })
  activeCashiers: number;

  @ApiProperty({ example: 3 })
  tillCount: number;

  @ApiProperty({ example: 5 })
  peripheralCount: number;

  @ApiProperty({ example: 2, description: 'Staff with a POS PIN set' })
  staffPinCount: number;

  @ApiProperty({ example: 24 })
  tableCount: number;

  @ApiProperty({ example: 200 })
  offlineBufferLimit: number;

  @ApiProperty({ example: 60 })
  autoSyncIntervalSec: number;

  @ApiProperty({ example: true })
  supervisorPinRequired: boolean;
}
