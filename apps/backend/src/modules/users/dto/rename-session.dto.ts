import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameSessionDto {
  @ApiProperty({ example: 'My laptop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  deviceName: string;
}
