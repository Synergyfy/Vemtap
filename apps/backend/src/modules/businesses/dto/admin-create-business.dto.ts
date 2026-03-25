import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsEmail,
  IsUrl,
  IsArray,
  MinLength,
  IsStrongPassword,
} from 'class-validator';
import { BusinessStatus } from '../entities/business.entity';

export class AdminCreateBusinessDto {
  @ApiProperty({
    example: 'VemTap Head Office',
    description: 'The name of the business',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the business owner',
  })
  @IsString()
  @IsNotEmpty()
  ownerFirstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the business owner',
  })
  @IsString()
  @IsNotEmpty()
  ownerLastName: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the business owner',
  })
  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'The password for the new business owner',
  })
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  ownerPassword: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'The phone number of the business owner',
  })
  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @ApiPropertyOptional({ enum: BusinessStatus, example: BusinessStatus.ACTIVE })
  @IsEnum(BusinessStatus)
  @IsOptional()
  status?: BusinessStatus;

  // --- Business Details (matching RegisterOwnerDto) ---

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/logo.png',
    description: 'Business logo URL',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

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
  visitors?: string;

  @ApiPropertyOptional({
    example: ['Capture Leads', 'Digital Loyalty'],
    description: 'Business goals',
  })
  @IsOptional()
  @IsArray()
  goals?: string[];

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
  address?: string;

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
  website?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the business is officially registered',
  })
  @IsOptional()
  isRegistered?: boolean;

  @ApiPropertyOptional({
    example: 'RC1234567',
    description: 'Business registration number',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/doc.pdf'],
    description: 'Business documents',
  })
  @IsOptional()
  @IsString({ each: true })
  documents?: string[];

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
}
