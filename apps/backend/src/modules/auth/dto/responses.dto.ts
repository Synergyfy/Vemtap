import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token',
  })
  access_token: string;

  @ApiProperty({ type: User })
  user: User;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ example: 'OTP verified successfully' })
  message: string;
}
