import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * The status a ledger row is *shown* as. A `claimed` voucher past its
 * `expiresAt` is reported as `expired` even before a job flips the column, so
 * the ledger agrees with the deal stats' expiry count.
 */
export enum OfferLedgerStatus {
  CLAIMED = 'claimed',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

/** Filters for `GET /catalogue/offers/ledger`. */
export class OfferLedgerQueryDto {
  @ApiPropertyOptional({ enum: OfferLedgerStatus })
  @IsOptional()
  @IsEnum(OfferLedgerStatus)
  status?: OfferLedgerStatus;

  @ApiPropertyOptional({ description: 'Only claims for offers at this branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description:
      'Only claims for this deal (every branch of a multi-branch deal)',
  })
  @IsOptional()
  @IsUUID()
  dealGroupId?: string;

  @ApiPropertyOptional({
    description:
      'ISO date. Rows are dated by redemption when redeemed, otherwise by claim.',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date; defaults to now' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
