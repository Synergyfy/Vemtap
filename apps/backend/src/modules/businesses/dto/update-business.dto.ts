import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsUrl,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'The Azure Bistro' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({ example: 'Art Studio' })
  @IsOptional()
  @IsString()
  otherSubcategoryName?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isRegistered?: boolean;

  @ApiPropertyOptional({ example: 'RC1234567' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: ['https://example.com/doc.pdf'] })
  @IsOptional()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '123 Business Ave, Lagos' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 6.5244, description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 3.3792, description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'A premium restaurant...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'A premium restaurant...',
    description: 'Alias for description (sent from frontend)',
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({
    example: { Monday: { open: '09:00', close: '18:00' } },
    description: 'Alias for openingHours (sent from frontend)',
  })
  @IsOptional()
  @IsObject()
  businessHours?: Record<string, any>;

  @ApiPropertyOptional({ example: 'https://greenterrace.com' })
  @IsOptional()
  @IsString()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: { instagram: '...', facebook: '...' } })
  @IsOptional()
  @IsObject()
  socials?: Record<string, string>;

  @ApiPropertyOptional({ example: 'https://facebook.com/mybusiness' })
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/mybusiness' })
  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @ApiPropertyOptional({ example: 'https://tiktok.com/@mybusiness' })
  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @ApiPropertyOptional({ example: 'https://x.com/mybusiness' })
  @IsOptional()
  @IsString()
  xUrl?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/mybusiness' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'hello@greenterrace.com' })
  @IsOptional()
  @IsString()
  officialEmail?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiPropertyOptional({
    example: { Monday: { open: '09:00', close: '18:00' } },
  })
  @IsOptional()
  @IsObject()
  openingHours?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Africa/Lagos' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional({
    example: { loyaltyEnabled: true, loyaltyRedeemThreshold: 100 },
    description: 'POS settings for the business',
  })
  @IsOptional()
  @IsObject()
  posSettings?: {
    currency?: string;
    receiptHeader?: string;
    receiptFooter?: string;
    autoPrintReceipt?: boolean;
    showLogo?: boolean;
    taxEnabled?: boolean;
    taxRate?: number;
    taxLabel?: string;
    pricesIncludeTax?: boolean;
    loyaltyEnabled?: boolean;
    loyaltyRedeemThreshold?: number;
    lowStockAlerts?: boolean;
    dailySalesSummary?: boolean;
    newOrderAlert?: boolean;
    staffActivityAlerts?: boolean;
  };

  @ApiPropertyOptional({
    example: 'VEM-ABC-1234',
    description: 'Referral code from an affiliate partner',
  })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'When true, reviews submitted for deals require owner approval before being published (Platinum feature)',
  })
  @IsOptional()
  @IsBoolean()
  requireReviewApproval?: boolean;
}
