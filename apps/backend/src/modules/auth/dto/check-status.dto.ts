import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckStatusDto {
  @ApiProperty({ example: 'user@example.com or +234...' })
  @IsNotEmpty()
  @IsString()
  identifier: string;
}

export class CheckStatusResponseDto {
  @ApiProperty()
  exists: boolean;

  @ApiProperty()
  role?: string;

  @ApiProperty()
  isPasswordChanged?: boolean;

  @ApiProperty()
  hasRealEmail?: boolean;

  @ApiProperty()
  email?: string;
}
