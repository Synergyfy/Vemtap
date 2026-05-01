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

export class CreateQuickItemDto {
  @ApiProperty({ example: 'New Item' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 1000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class OrderItemDto {
  @ApiPropertyOptional({ example: 'uuid-of-item' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-offer' })
  @IsOptional()
  @IsUUID()
  offerId?: string;

  @ApiPropertyOptional({ type: CreateQuickItemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuickItemDto)
  newItem?: CreateQuickItemDto;

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

  @ApiPropertyOptional({ example: '2024-05-20' })
  @IsOptional()
  @IsString()
  bookingDate?: string;

  @ApiPropertyOptional({ example: '10:00 AM' })
  @IsOptional()
  @IsString()
  bookingTime?: string;
}

export class BulkOrderDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 'No spicy' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Table 5' })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional({ example: '2024-05-20' })
  @IsOptional()
  @IsString()
  bookingDate?: string;

  @ApiPropertyOptional({ example: '10:00 AM' })
  @IsOptional()
  @IsString()
  bookingTime?: string;
}

export class BulkCheckoutDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: [BulkOrderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkOrderDto)
  orders: BulkOrderDto[];

  @ApiPropertyOptional({ example: 'uuid-of-device' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;
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

  @ApiPropertyOptional({
    example: 'booking',
    description: 'Filter by type: order or booking',
  })
  @IsOptional()
  @IsString()
  type?: string;
}
