import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The `refresh_token` from the last sign-in or refresh',
  })
  @IsString()
  @MaxLength(200)
  refreshToken: string;
}
