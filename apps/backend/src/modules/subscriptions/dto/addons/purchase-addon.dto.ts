import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class PurchaseAddonDto {
  @ApiProperty({
    description: 'IDs of the add-ons to purchase',
    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    if (Array.isArray(value)) {
      return value
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.trim());
    }
    return value;
  })
  addonIds: string[];

  @ApiPropertyOptional({
    description:
      'Quantity of each add-on to purchase (must match addonIds length)',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const parts = value
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      return parts.length > 0 ? parts : undefined;
    }
    if (Array.isArray(value)) {
      const mapped = value
        .map((v) => (typeof v === 'number' ? v : parseInt(String(v).trim(), 10)))
        .filter((n) => !isNaN(n));
      return mapped.length > 0 ? mapped : undefined;
    }
    return undefined;
  })
  quantities?: number[];

  @ApiPropertyOptional({
    description: 'Paystack transaction reference for payment verification',
    example: 'TRF_abc123xyz',
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({
    description:
      'Quantity for a single add-on purchase (used when only one addonId is provided)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;
}

export class PurchaseAddonResponseDto {
  @ApiProperty({
    description: 'ID of the add-on purchased',
    example: 'uuid-addon-1',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the purchased add-on',
    example: '3 Extra Branches',
  })
  name: string;

  @ApiProperty({
    description: 'Type of the purchased add-on',
    example: 'RESOURCE',
  })
  type: string;

  @ApiProperty({
    description: 'Status of the purchase',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'When the add-on was purchased',
    example: '2026-05-06T10:00:00Z',
  })
  purchasedAt: Date;

  @ApiProperty({
    description: 'When the add-on expires',
    example: '2026-06-05T10:00:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Quantity purchased',
    example: 1,
  })
  quantity: number;

  @ApiProperty({
    description: 'Total amount paid',
    example: 15000,
  })
  totalPaid: number;

  @ApiProperty({
    description: 'Description of the add-on',
    example: 'Adds 3 additional branch slots to your plan',
  })
  description: string;
}
