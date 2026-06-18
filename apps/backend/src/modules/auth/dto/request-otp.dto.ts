import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';
import { Transform } from 'class-transformer';

export class RequestOtpDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.OWNER })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized =
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    return normalized as UserRole;
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
