import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({ example: 'fcm-token-abc-123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  token: string;
}
