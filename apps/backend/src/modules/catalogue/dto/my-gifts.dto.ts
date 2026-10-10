import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DealGiftStatus } from '../entities/catalogue-deal-gift.entity';

/**
 * Filters for the sender's own gift list. Unlike claims, gifts are not created
 * anonymously, so there is no legacy-ownership fallback here: every row is
 * scoped by `senderId`.
 */
export class MyGiftsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Opt-in pagination, as with `/me/claims`.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    enum: DealGiftStatus,
    description:
      'Filter by recipient outcome. Omitted returns all three. `rejected` ' +
      'rows are soft-removed when declined, so they are only visible here and ' +
      'not in the branch dashboard.',
  })
  @IsOptional()
  @IsEnum(DealGiftStatus)
  status?: DealGiftStatus;

  @ApiPropertyOptional({
    example: 'sam',
    maxLength: 100,
    description:
      'Case-insensitive match against the recipient email, recipient name, ' +
      'sender name or offer name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

/** The deal details the sender needs to recognise what was gifted. */
export class MyGiftOfferDto {
  @ApiProperty({ example: 'uuid-of-offer' })
  id: string;

  @ApiProperty({ example: 'Apo Lunch Combo' })
  name: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-...',
    nullable: true,
  })
  mainImage: string | null;

  @ApiProperty({ example: 8500, description: 'Deal price of the offer' })
  calculatedPrice: number;

  @ApiProperty({ example: 10000, nullable: true })
  originalPrice: number | null;
}

export class MyGiftDto {
  @ApiProperty({ example: 'uuid-of-gift' })
  id: string;

  @ApiProperty({ example: 'friend@example.com' })
  recipientEmail: string;

  @ApiProperty({ example: 'Sam Taylor', nullable: true })
  recipientName: string | null;

  @ApiProperty({ example: 'Hope you enjoy this lunch deal!', nullable: true })
  note: string | null;

  @ApiProperty({
    enum: DealGiftStatus,
    example: DealGiftStatus.PENDING,
    description:
      '`pending` until the recipient claims it. Declining soft-removes the row ' +
      'with `status: rejected`, so it is hidden from every other gift query.',
  })
  status: DealGiftStatus;

  @ApiProperty({ example: '2026-10-08T19:26:05.899Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-09T10:00:00.000Z', nullable: true })
  acceptedAt: Date | null;

  @ApiProperty({ example: '2026-10-09T10:00:00.000Z', nullable: true })
  rejectedAt: Date | null;

  @ApiProperty({ example: 'Location too far', nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ type: MyGiftOfferDto })
  offer: MyGiftOfferDto;

  @ApiProperty({ example: 'Patrick Ventures', nullable: true })
  businessName: string | null;

  @ApiProperty({ example: 'Apo Branch', nullable: true })
  branchName: string | null;
}

export class MyGiftsPageDto {
  @ApiProperty({ type: [MyGiftDto] })
  data: MyGiftDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
