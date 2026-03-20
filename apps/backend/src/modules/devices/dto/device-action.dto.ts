import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateDevicesDto {
  @ApiProperty({ description: 'The ID of the branch to generate devices for' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}

export class DeviceQueryDto {
  @ApiProperty({ description: 'The ID of the branch' })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}
