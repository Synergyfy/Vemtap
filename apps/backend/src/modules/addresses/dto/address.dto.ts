import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CustomerAddress } from '../entities/customer-address.entity';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  label: string;

  @ApiProperty({ example: '12 Aminu Kano Crescent, Wuse II', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  line: string;

  @ApiPropertyOptional({ example: 'Abuja, FCT', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @ApiPropertyOptional({ example: 'Gate code 4411', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @ApiPropertyOptional({ example: 9.0765 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 7.3986 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Make this the default. The first address is always default.',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

export class AddressListDto {
  @ApiProperty({ type: [CustomerAddress] })
  data: CustomerAddress[];

  @ApiProperty({ example: 2 })
  total: number;
}
