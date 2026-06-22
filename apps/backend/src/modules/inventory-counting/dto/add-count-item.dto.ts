import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CountItemEntryDto {
  @ApiProperty({ example: 'uuid-of-catalogue-item' })
  @IsNotEmpty()
  @IsUUID()
  itemId: string;

  @ApiProperty({ example: 'Cheeseburger' })
  @IsNotEmpty()
  @IsString()
  itemName: string;

  @ApiPropertyOptional({ example: 'CB-001' })
  @IsOptional()
  @IsString()
  itemSku?: string;

  @ApiPropertyOptional({ example: 'Food' })
  @IsOptional()
  @IsString()
  itemCategory?: string;

  @ApiPropertyOptional({ example: '4901234567890' })
  @IsOptional()
  @IsString()
  itemBarcode?: string;

  @ApiProperty({ example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  systemQuantity: number;

  @ApiPropertyOptional({ example: 48 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  countedQuantity?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @ApiPropertyOptional({ example: 'Damaged packaging' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddCountItemsDto {
  @ApiProperty({ type: [CountItemEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountItemEntryDto)
  items: CountItemEntryDto[];
}

export class UpdateCountItemDto {
  @ApiProperty({ example: 48 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  countedQuantity: number;

  @ApiPropertyOptional({ example: 'Found in back storage' })
  @IsOptional()
  @IsString()
  notes?: string;
}
