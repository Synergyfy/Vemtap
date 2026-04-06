import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'new-email@company.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
