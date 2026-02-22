import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DeviceStatus } from '../entities/device.entity';

export class UpdateDeviceDto {
  @ApiPropertyOptional({ example: 'Back Entrance Tag' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Kitchen Area' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'branch-uuid' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ enum: DeviceStatus, example: DeviceStatus.INACTIVE })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
