import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { DeviceStatus } from '../entities/device.entity';

export class AdminUpdateDeviceDto {
  @ApiPropertyOptional({
    example: 'Front Entrance Tag',
    description: 'Friendly name for the device',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'LT-8829-X',
    description: 'Unique serial number/code on the physical tag',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    example: 'Card',
    description: 'Form factor of the device',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Business ID to assign the device to',
  })
  @IsUUID()
  @IsOptional()
  businessId?: string;

  @ApiPropertyOptional({ enum: DeviceStatus, example: DeviceStatus.ACTIVE })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @ApiPropertyOptional({ example: 'Main Lobby' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  productTypeId?: string;
}
