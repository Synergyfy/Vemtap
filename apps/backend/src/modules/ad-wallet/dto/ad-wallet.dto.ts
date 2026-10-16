import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdWalletTransactionType } from '../entities/ad-wallet-transaction.entity';
import {
  AD_WALLET_MAX_TOPUP,
  AD_WALLET_MIN_TOPUP,
  AD_WALLET_PREPACKS,
} from '../ad-wallet.constants';

export class AdWalletTopUpDto {
  @ApiPropertyOptional({
    enum: AD_WALLET_PREPACKS.map((pack) => pack.id),
    description:
      'A bundle from GET /ad-wallet/prepacks. Give this or `amount`.',
  })
  @IsOptional()
  @IsIn(AD_WALLET_PREPACKS.map((pack) => pack.id))
  prepackId?: string;

  @ApiPropertyOptional({
    example: 15000,
    description: `Custom amount in naira (${AD_WALLET_MIN_TOPUP}–${AD_WALLET_MAX_TOPUP}); no bonus`,
  })
  @IsOptional()
  @IsNumber()
  @Min(AD_WALLET_MIN_TOPUP)
  @Max(AD_WALLET_MAX_TOPUP)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Where Paystack returns the customer after paying',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false, require_protocol: true })
  callbackUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Save this card for future top-ups, auto-reload and campaign launches (owner consent)',
  })
  @IsOptional()
  @IsBoolean()
  saveCard?: boolean;
}

export class AdWalletSavedCardTopUpDto {
  @ApiPropertyOptional({
    enum: AD_WALLET_PREPACKS.map((pack) => pack.id),
    description:
      'A bundle from GET /ad-wallet/prepacks. Give this or `amount`.',
  })
  @IsOptional()
  @IsIn(AD_WALLET_PREPACKS.map((pack) => pack.id))
  prepackId?: string;

  @ApiPropertyOptional({
    example: 15000,
    description: `Custom amount in naira (${AD_WALLET_MIN_TOPUP}–${AD_WALLET_MAX_TOPUP}); no bonus`,
  })
  @IsOptional()
  @IsNumber()
  @Min(AD_WALLET_MIN_TOPUP)
  @Max(AD_WALLET_MAX_TOPUP)
  amount?: number;
}

export class AdWalletAutoReloadDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    example: 2000,
    description: 'Reload when the spendable balance (₦) drops below this',
  })
  @IsNumber()
  @Min(0)
  @Max(AD_WALLET_MAX_TOPUP)
  threshold: number;

  @ApiProperty({
    example: 10000,
    description: `How much to top up each time (₦${AD_WALLET_MIN_TOPUP}–${AD_WALLET_MAX_TOPUP})`,
  })
  @IsNumber()
  @Min(AD_WALLET_MIN_TOPUP)
  @Max(AD_WALLET_MAX_TOPUP)
  amount: number;
}

export class AdWalletInvoicesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdWalletTransactionsQueryDto {
  @ApiPropertyOptional({ enum: AdWalletTransactionType })
  @IsOptional()
  @IsEnum(AdWalletTransactionType)
  type?: AdWalletTransactionType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
