import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, ValidateIf } from 'class-validator';
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
  @IsOptional()
  @ValidateIf((o, v) => v !== '' && v !== null)
  @IsUUID()
  branchId?: string | null;

  @ApiPropertyOptional({ enum: DeviceStatus, example: DeviceStatus.INACTIVE })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
