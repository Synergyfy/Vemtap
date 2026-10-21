import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { STORE_ORDER_SOURCES } from '../../catalogue-orders/dto/catalogue-order.dto';
import { STORE_QR_TYPES } from '../entities/store-qr-code.entity';

export const STORE_ORDER_STATUSES = [
  'new',
  'accepted',
  'preparing',
  'partially-fulfilled',
  'ready',
  'awaiting-payment',
  'paid',
  'completed',
  'rejected',
  'cancelled',
] as const;
export type StoreOrderStatus = (typeof STORE_ORDER_STATUSES)[number];

export class StoreOrderQueryDto {
  @ApiPropertyOptional({ enum: STORE_ORDER_STATUSES })
  @IsOptional()
  @IsIn(STORE_ORDER_STATUSES)
  status?: StoreOrderStatus;

  @ApiPropertyOptional({ enum: STORE_ORDER_SOURCES })
  @IsOptional()
  @IsIn(STORE_ORDER_SOURCES)
  source?: string;

  @ApiPropertyOptional({ description: 'A branch of the caller’s business' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UpdateStoreOrderStatusDto {
  @ApiProperty({ enum: STORE_ORDER_STATUSES, example: 'preparing' })
  @IsIn(STORE_ORDER_STATUSES)
  status: StoreOrderStatus;

  @ApiPropertyOptional({ example: 'Kitchen started' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class SubstitutionDto {
  @ApiProperty({ example: 'Sirloin (350g)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  replacementName: string;

  @ApiProperty({
    example: -1500,
    description: 'Change to the unit price, in naira',
  })
  @IsNumber()
  @Min(-10_000_000)
  @Max(10_000_000)
  priceDiff: number;
}

export class UpdateStoreOrderItemDto {
  @ApiPropertyOptional({ example: false, description: 'Out of stock' })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  removed?: boolean;

  @ApiPropertyOptional({ type: SubstitutionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubstitutionDto)
  substitution?: SubstitutionDto;
}

export class AssignStoreOrderDto {
  @ApiProperty({ description: 'A team member of the caller’s business' })
  @IsUUID()
  staffUserId: string;
}

export class RecordStorePaymentDto {
  @ApiProperty({
    example: 'cash',
    description: 'cash, pos-terminal, bank-transfer, ussd, store-credit, …',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  method: string;

  @ApiPropertyOptional({
    example: 30000,
    description: 'Defaults to the amount due',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountReceived?: number;

  @ApiPropertyOptional({ example: 'TRF-88201' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  reference?: string;

  @ApiPropertyOptional({ example: 'Paid by the customer’s friend' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Complete the order when fully paid',
  })
  @IsOptional()
  @IsBoolean()
  markCompleted?: boolean;
}

export class CompleteFromPosDto {
  @ApiProperty({ example: 'card' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  tender: string;

  @ApiProperty({
    description: 'The POS sale that took the payment (same business)',
  })
  @IsUUID()
  posSaleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class CreateStoreQrDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Table 04 — Indoor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: STORE_QR_TYPES, example: 'section' })
  @IsIn(STORE_QR_TYPES)
  type: (typeof STORE_QR_TYPES)[number];

  @ApiPropertyOptional({ example: 'Indoor Dining Hall' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  targetLabel?: string;

  @ApiPropertyOptional({ description: 'Product id, for a product QR' })
  @IsOptional()
  @IsUUID()
  targetId?: string;
}

export class UpdateStoreQrDto {
  @ApiPropertyOptional({ example: 'Table 04' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Patio' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  targetLabel?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PaymentMethodSettingDto {
  @ApiProperty({ example: 'cash' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  id: string;

  @ApiProperty({ example: 'Cash at Counter' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}

/** The store-ordering settings document (all fields present when read). */
export interface StoreOrderingSettings {
  enabled: boolean;
  usePosForCompletion: boolean;
  paymentMethods: { id: string; label: string; enabled: boolean }[];
  /** Branch id → whether it takes store orders. Missing branches take them. */
  activeBranches: Record<string, boolean>;
  immediatePickup: boolean;
  scheduledPreOrder: boolean;
  defaultPrepMinutes: number;
  pickupInstructions: string;
  guestOrderingAllowed: boolean;
  acceptOrdersOutsideHours: boolean;
  allowSubstitutions: boolean;
  autoNotifyCustomerSms: boolean;
  autoNotifyCustomerWhatsApp: boolean;
  notifiedStaff: string[];
}

export class UpdateStoreOrderingSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  usePosForCompletion?: boolean;

  @ApiPropertyOptional({ type: [PaymentMethodSettingDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodSettingDto)
  paymentMethods?: PaymentMethodSettingDto[];

  @ApiPropertyOptional({ example: { 'branch-uuid': true } })
  @IsOptional()
  @IsObject()
  activeBranches?: Record<string, boolean>;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() immediatePickup?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() scheduledPreOrder?: boolean;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  defaultPrepMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pickupInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  guestOrderingAllowed?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptOrdersOutsideHours?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowSubstitutions?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoNotifyCustomerSms?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoNotifyCustomerWhatsApp?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  notifiedStaff?: string[];
}
