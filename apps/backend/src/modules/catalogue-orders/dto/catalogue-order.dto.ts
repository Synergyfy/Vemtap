import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CatalogueOrderStatus } from '../entities/catalogue-order.entity';

export class OrderItemDto {
  @ApiPropertyOptional({ example: 'uuid-of-item' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-offer' })
  @IsOptional()
  @IsUUID()
  offerId?: string;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateCatalogueOrderDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'No spicy' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Table 5' })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ example: 'uuid-of-device' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({
    example: 'uuid-v4-session-token',
    description:
      'Session token from the portal visit. Used to upgrade the visit to patronage on order completion.',
  })
  @IsOptional()
  @IsUUID()
  sessionToken?: string;
}

export class UpdateCatalogueOrderStatusDto {
  @ApiProperty({ enum: CatalogueOrderStatus })
  @IsNotEmpty()
  @IsEnum(CatalogueOrderStatus)
  status: CatalogueOrderStatus;
}

export class CatalogueOrderQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: CatalogueOrderStatus })
  @IsOptional()
  @IsEnum(CatalogueOrderStatus)
  status?: CatalogueOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
