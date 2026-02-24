import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RegisterDto } from './register.dto';

export class RegisterAdminDto extends RegisterDto {
  @ApiProperty({
    example: 'admin_secret_123',
    description: 'Special code required to create an admin account',
  })
  @IsString()
  @IsNotEmpty()
  adminAccountCode: string;
}
