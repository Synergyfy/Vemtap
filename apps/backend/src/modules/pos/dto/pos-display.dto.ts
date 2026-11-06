import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { PosOrderType } from '../pos-settings.types';

export class PosDisplayLineDto {
  @ApiProperty({ example: 'Jollof Rice & Chicken' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 2700 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class PutPosDisplayTicketDto {
  @ApiProperty({ type: [PosDisplayLineDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PosDisplayLineDto)
  lines: PosDisplayLineDto[];

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ enum: ['dine_in', 'takeaway'] })
  @IsOptional()
  @IsIn(['dine_in', 'takeaway'])
  orderType?: PosOrderType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  waiveServiceCharge?: boolean;

  @ApiPropertyOptional({ example: '12' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  tableNumber?: string;

  @ApiPropertyOptional({ example: 'Tolu' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  customerName?: string;

  @ApiPropertyOptional({
    example: '#042',
    description: 'Ticket label on the till',
  })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  reference?: string;
}

export class ClearPosDisplayQueryDto {
  @ApiPropertyOptional({ description: 'Sale that settled the ticket' })
  @IsOptional()
  @IsUUID()
  saleId?: string;
}

export class PosDisplayTipRatingDto {
  @ApiPropertyOptional({ description: 'Sale to attach the tip and rating to' })
  @IsOptional()
  @IsUUID()
  saleId?: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  tipAmount: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
