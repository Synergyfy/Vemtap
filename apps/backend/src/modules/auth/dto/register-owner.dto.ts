import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  IsUrl,
  IsArray,
  IsEnum,
} from 'class-validator';

export class RegisterOwnerDto {
  // --- User Details ---
  @ApiProperty({ example: 'Daniel', description: 'First name of the owner' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name of the owner' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'daniel@company.com',
    description: 'Email address (used for login)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Password (min 6 chars)',
  })
  @IsString()
  @MinLength(6)
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

  @ApiPropertyOptional({
    example: 'hello@greenterrace.com',
    description: 'Official public-facing email',
  })
  @IsOptional()
  @IsEmail()
  officialEmail?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Primary business phone number',
  })
  @IsOptional()
  @IsString()
  businessNumber?: string;

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
