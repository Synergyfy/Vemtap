import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class UpdateFosSettingsDto {
  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Africa/Lagos' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'DD/MM/YYYY' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ example: 'light' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'sk_test_xxxxxxxx' })
  @IsOptional()
  @IsString()
  paystackSecretKey?: string;

  @ApiPropertyOptional({ example: 'TL_xxxxxxxx' })
  @IsOptional()
  @IsString()
  termiiApiKey?: string;
}

export class InviteTeamMemberDto {
  @ApiProperty({ example: 'colleague@vemtap.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @IsOptional()
  @IsEnum([UserRole.ADMIN, UserRole.SUPER_ADMIN])
  role?: UserRole;
}
