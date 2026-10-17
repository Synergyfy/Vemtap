import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameSessionDto {
  @ApiProperty({ example: 'My laptop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  deviceName: string;
}

export class DescribeCurrentSessionDto {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  deviceName: string;

  @ApiProperty({ example: 'ios', enum: ['ios', 'android', 'web'] })
  @IsIn(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';
}
