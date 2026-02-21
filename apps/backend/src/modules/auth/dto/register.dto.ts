import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'First name of the user' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name of the user' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'business@latap.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Password (min 6 chars)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.OWNER,
    description:
      'Role of the user (default: customer or owner if businessName is present)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  // Business Fields (Optional - for Owner signup)
  @ApiPropertyOptional({
    example: 'The Azure Bistro',
    description: 'Name of the business (required for Owners)',
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({
    example: 'Hospitality',
    description: 'Category of business',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: '501-2000',
    description: 'Monthly visitor range',
  })
  @IsOptional()
  @IsString()
  monthlyVisitors?: string;

  @ApiPropertyOptional({
    example: 'Digital Loyalty',
    description: 'Main business goal',
  })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({
    example: 'uuid-string',
    description: 'Business ID (for joining existing business as staff)',
  })
  @IsOptional()
  @IsString()
  businessId?: string;
}
