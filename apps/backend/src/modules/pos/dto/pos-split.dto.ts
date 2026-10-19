import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { PosOrderType } from '../pos-settings.types';

export type PosSplitMode = 'equal' | 'by_item' | 'custom';

export class PosSplitLineDto {
  @ApiProperty({ example: 'line-1', description: 'Client key for the line' })
  @IsString()
  @MaxLength(64)
  id: string;

  @ApiProperty({ example: 'Pepper Soup' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class PosSplitPersonDto {
  @ApiProperty({ example: 'Tolu' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({
    example: ['line-1'],
    description:
      'by_item: lines this person takes; a shared line splits evenly',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lineIds?: string[];

  @ApiPropertyOptional({
    example: 10000,
    description: 'custom: amount this person pays',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class PosSplitPreviewDto {
  @ApiProperty({ type: [PosSplitLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PosSplitLineDto)
  lines: PosSplitLineDto[];

  @ApiProperty({ enum: ['equal', 'by_item', 'custom'] })
  @IsIn(['equal', 'by_item', 'custom'])
  mode: PosSplitMode;

  @ApiProperty({ type: [PosSplitPersonDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PosSplitPersonDto)
  people: PosSplitPersonDto[];

  @ApiPropertyOptional({ example: 0 })
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
}
