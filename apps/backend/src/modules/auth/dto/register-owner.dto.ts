import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  IsUrl,
  IsArray,
  IsStrongPassword,
} from 'class-validator';

export class RegisterOwnerDto {
  @ApiProperty({
    example: 'daniel@company.com',
    description: 'Email address (must match the one used for OTP)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password (min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol)',
  })
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  // --- Business Details ---
  @ApiProperty({
    example: 'Green Terrace Cafe',
    description: 'Name of the business',
  })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/logo.png',
    description: 'Business logo URL or base64',
  })
  @IsOptional()
  @IsString()
  businessLogo?: string;

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
  visitors?: string; // Mapped from frontend 'visitors'

  @ApiPropertyOptional({
    example: ['Capture Leads', 'Digital Loyalty'],
    description: 'Business goals',
  })
  @IsOptional()
  @IsArray()
  goals?: string[]; // Mapped from frontend 'goals' (array)

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'WhatsApp number for support',
  })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiProperty({
    example: 'hello@greenterrace.com',
    description: 'Official public-facing email',
  })
  @IsEmail()
  @IsNotEmpty()
  officialEmail: string;

  @ApiProperty({
    example: '+2348012345678',
    description: 'Primary business phone number',
  })
  @IsString()
  @IsNotEmpty()
  businessNumber: string;

  @ApiPropertyOptional({
    example: '123 Business Ave, Lagos',
    description: 'Physical address',
  })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({
    example: 'https://greenterrace.com',
    description: 'Business website',
  })
  @IsOptional()
  @IsUrl()
  businessWebsite?: string;
}
