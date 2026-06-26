import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsArray,
  ValidateNested, Min, IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosOrderItemDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID of the catalogue item (omit if using offerId)' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ example: '660e8400-e29b-41d4-a716-446655440001', description: 'UUID of the catalogue offer (omit if using itemId)' })
  @IsOptional()
  @IsUUID()
  offerId?: string;

  @ApiProperty({ example: 2, description: 'Quantity of the item/offer' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePosOrderDto {
  @ApiProperty({ example: '770e8400-e29b-41d4-a716-446655440002', description: 'UUID of the branch placing the order' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({
    type: [PosOrderItemDto],
    example: [{ itemId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 }],
    description: 'Array of items/offers in the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @ApiPropertyOptional({ example: '880e8400-e29b-41d4-a716-446655440003', description: 'UUID of an existing customer (staff mode only)' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: 'John', description: 'Customer first name (required for new/guest customers)' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Customer last name (required for new/guest customers)' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348012345678', description: 'Customer phone number (required for new/guest customers)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Customer email (optional)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'No spicy', description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Table 5', description: 'Dine-in table number' })
  @IsOptional()
  @IsString()
  tableNumber?: string;
}
