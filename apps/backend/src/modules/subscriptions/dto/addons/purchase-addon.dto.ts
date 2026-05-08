import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class PurchaseAddonDto {
  @ApiProperty({
    description: 'IDs of the add-ons to purchase',
    example: ['uuid-addon-1', 'uuid-addon-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
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