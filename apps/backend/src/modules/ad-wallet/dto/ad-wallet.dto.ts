import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
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
