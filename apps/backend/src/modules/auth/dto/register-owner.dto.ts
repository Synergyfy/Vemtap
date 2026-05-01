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
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class RegisterOwnerDto {
  @ApiProperty({
    example: 'daniel@company.com',
    description: 'Email address (must match the one used for OTP)',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: 'SecurePass123!',
    description:
      'Password (min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol). Required for manual signup, optional for social logins.',
  })
  @IsOptional()
  @ValidateIf((o) => !!o.password)
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password?: string;

  // --- Business Details ---
  @ApiPropertyOptional({
    example: 'Green Terrace Cafe',
    description: 'Name of the business',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  businessName?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/logo.png',
    description: 'Business logo URL or base64',
  })
  @IsOptional()
  @IsString()
  businessLogo?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Category ID of the business',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Subcategory ID of the business',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({
    example: 'Art Studio',
    description: 'Name of the subcategory if "Others" is selected',
  })
  @IsOptional()
  @IsString()
  otherSubcategoryName?: string;

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
  @IsNotEmpty()
  officialEmail?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Primary business phone number',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  businessNumber?: string;

  @ApiPropertyOptional({
    example: '123 Business Ave, Lagos',
    description: 'Physical address',
  })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({
    example: 'Lagos',
    description: 'Business state',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    example: 'Ikeja',
    description: 'Business city',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'https://greenterrace.com',
    description: 'Business website',
  })
  @IsOptional()
  @IsUrl()
  businessWebsite?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the business is officially registered',
  })
  @IsOptional()
  isRegistered?: boolean;

  @ApiPropertyOptional({
    example: {
      instagram: 'https://instagram.com/johndoe',
      linkedin: 'https://linkedin.com/company/johndoe',
      reviewUrl: 'https://g.page/r/...',
    },
    description: 'User engagement settings (social links, etc.)',
  })
  @IsOptional()
  engagement?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'VEM-DAN-1234',
    description: 'Optional referral code from an affiliate',
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
