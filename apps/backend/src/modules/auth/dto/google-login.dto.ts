import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';
import { Transform } from 'class-transformer';

export class GoogleLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImt...',
    description: 'The id_token returned from Google OAuth Client',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.CUSTOMER,
    description: 'The intended role for a new user (customer or owner)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    // Map 'owner' -> 'Owner', 'customer' -> 'Customer', etc.
    const normalized =
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    return normalized;
  })
  @IsEnum(UserRole)
  role?: UserRole;
}
