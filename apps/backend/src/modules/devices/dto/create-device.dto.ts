import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({
    example: 'Front Entrance Tag',
    description: 'Friendly name for the device',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'LT-8829-X',
    description: 'Unique serial number/code on the physical tag',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Main Door',
    description: 'Physical location of the device',
  })
  @IsString()
  @IsOptional()
  location?: string;
}
