import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * Payload for turning an existing (authenticated) CUSTOMER account into a
 * business owner without creating a second account. Mirrors the business
 * fields of `RegisterOwnerDto`; credentials are not re-collected because the
 * caller already has a session — the password is only required as a
 * confirmation step for local-auth accounts.
 */
export class UpgradeToOwnerDto {
  @ApiProperty({ example: 'SecurePass123!', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'Green Terrace Cafe' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  businessLogo?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({ example: 'Art Studio' })
  @IsOptional()
  @IsString()
  otherSubcategoryName?: string;

  @ApiPropertyOptional({ example: '501-2000' })
  @IsOptional()
  @IsString()
  visitors?: string;

  @ApiPropertyOptional({ example: ['Capture Leads', 'Digital Loyalty'] })
  @IsOptional()
  @IsArray()
  goals?: string[];

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: 'hello@greenterrace.com' })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  officialEmail?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  businessNumber?: string;

  @ApiPropertyOptional({ example: '123 Business Ave, Lagos' })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 6.5244 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 3.3792 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'https://greenterrace.com' })
  @IsOptional()
  @IsUrl()
  businessWebsite?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isRegistered?: boolean;

  @ApiPropertyOptional({
    example: {
      instagram: 'https://instagram.com/johndoe',
      reviewUrl: 'https://g.page/r/...',
    },
  })
  @IsOptional()
  engagement?: Record<string, any>;

  @ApiPropertyOptional({ example: 'VEM-DAN-1234' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
