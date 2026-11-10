import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
  MaxLength,
  ValidateIf,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'VemTap', required: false })
  @IsString()
  @IsOptional()
  platformName?: string;

  @ApiProperty({ example: 'support@VemTap.com', required: false })
  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @ApiProperty({ example: 'NGN', required: false })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiProperty({ example: 'Africa/Lagos', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  enforce2FA?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  passwordExpiry?: boolean;

  @ApiProperty({ example: 0.05, required: false })
  @IsNumber()
  @IsOptional()
  messagingCostSms?: number;

  @ApiProperty({ example: 0.08, required: false })
  @IsNumber()
  @IsOptional()
  messagingCostWhatsapp?: number;

  @ApiProperty({ example: 0.01, required: false })
  @IsNumber()
  @IsOptional()
  messagingCostEmail?: number;

  @ApiProperty({ example: 15.0, required: false })
  @IsNumber()
  @IsOptional()
  creditPriceSms?: number;

  @ApiProperty({ example: 25.0, required: false })
  @IsNumber()
  @IsOptional()
  creditPriceWhatsapp?: number;

  @ApiProperty({ example: 2.0, required: false })
  @IsNumber()
  @IsOptional()
  creditPriceEmail?: number;

  @ApiProperty({ example: 50.0, required: false })
  @IsNumber()
  @IsOptional()
  creditPriceAi?: number;

  @ApiProperty({ example: 'token_123', required: false })
  @IsOptional()
  @IsString()
  whatsappApiToken?: string;

  @ApiProperty({ example: 'verify_token', required: false })
  @IsOptional()
  @IsString()
  whatsappWebhookVerifyToken?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  whatsappBusinessId?: string;

  @ApiProperty({
    example: 'https://graph.facebook.com/v17.0/',
    required: false,
  })
  @IsOptional()
  @IsString()
  whatsappApiBaseUrl?: string;

  @ApiProperty({ example: 20, required: false })
  @IsNumber()
  @IsOptional()
  affiliateDirectCommission?: number;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  affiliateIndirectCommission?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @IsOptional()
  affiliateCommissionDurationMonths?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  affiliateMinimumWithdrawal?: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @IsOptional()
  affiliateFirstPaymentCommission?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  affiliateRecurringCommission?: number;

  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=abc123',
    required: false,
    nullable: true,
    description: 'Referral programme video link; null restores the app default',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  referralVideoUrl?: string | null;

  @ApiProperty({ example: '₦ (NGN)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  platformCurrencySymbol?: string;
  @ApiProperty({ example: 7.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  platformVatRate?: number;
  @ApiProperty({ example: 5.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  withholdingTaxRate?: number;
  @ApiProperty({ example: 1.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultPosTakeRate?: number;
  @ApiProperty({ example: 24, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  escrowHoldingHours?: number;
  @ApiProperty({ example: 2000, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultGeofenceRadiusMeters?: number;
  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxClustersPerMerchant?: number;
  @ApiProperty({ example: 45, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  nfcHeartbeatIntervalSec?: number;
  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  strictKybGate?: boolean;
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  dualAuthorizerEscrow?: boolean;
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  autoDunningActive?: boolean;
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  smsGatewayFallback?: boolean;
  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  realtimeTelemetryRateLimit?: boolean;
}
