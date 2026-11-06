import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** A day the service cannot be booked (holiday, leave, maintenance). */
export class BookingBlockoutDto {
  @ApiPropertyOptional({ example: '2026-12-25' })
  @Matches(DATE, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional({ example: 'Public holiday' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  reason?: string;
}

/** A branch's own days and hours for the service, replacing the service-wide ones there. */
export class BranchBookingScheduleDto {
  @ApiPropertyOptional({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3, 4, 5] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days?: number[];

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @Matches(TIME, { message: 'from must be HH:mm' })
  from?: string;

  @ApiPropertyOptional({ example: '20:00' })
  @IsOptional()
  @Matches(TIME, { message: 'to must be HH:mm' })
  to?: string;
}

/**
 * When a bookable service can be booked. Every field narrows the branch's
 * opening hours; an absent field leaves that part to the branch.
 */
export class BookingRulesDto {
  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2, 3, 4, 5, 6],
    description: 'Bookable weekdays, 0 = Sunday … 6 = Saturday',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days?: number[];

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Earliest start (HH:mm)',
  })
  @IsOptional()
  @Matches(TIME, { message: 'from must be HH:mm' })
  from?: string;

  @ApiPropertyOptional({ example: '18:00', description: 'Latest end (HH:mm)' })
  @IsOptional()
  @Matches(TIME, { message: 'to must be HH:mm' })
  to?: string;

  @ApiPropertyOptional({
    example: 15,
    description: 'Turnaround after each booking',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  bufferMinutes?: number;

  @ApiPropertyOptional({
    example: 120,
    description: 'Minimum notice before a start',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_080)
  leadMinutes?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'How far ahead it can be booked',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  horizonDays?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Clients served at the same time',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  capacity?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Owner confirms each booking (otherwise it is confirmed at once)',
  })
  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean;

  @ApiPropertyOptional({
    type: [BookingBlockoutDto],
    description: 'Dates the service cannot be booked',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BookingBlockoutDto)
  blockouts?: BookingBlockoutDto[];

  @ApiPropertyOptional({
    type: [BranchBookingScheduleDto],
    description: 'Per-branch days and hours (one per branch)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BranchBookingScheduleDto)
  branchSchedules?: BranchBookingScheduleDto[];
}

export type BookingRules = {
  [K in keyof BookingRulesDto]: BookingRulesDto[K];
};
