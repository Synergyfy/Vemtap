import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class AvailabilityQueryDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ example: 'uuid-of-catalogue-item' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiProperty({ example: '2026-10-20', description: 'YYYY-MM-DD' })
  @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })
  date: string;
}

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    example: 'uuid-of-catalogue-item',
    description: 'Omit for a generic branch booking',
  })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiProperty({ example: '2026-10-20', description: 'YYYY-MM-DD' })
  @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({
    example: '14:30',
    description: 'Slot start (HH:mm, 30-min grid)',
  })
  @Matches(TIME_RE, { message: 'time must be HH:mm' })
  time: string;

  @ApiPropertyOptional({ example: 'Window seat if possible' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Change of plans' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cancellationReason?: string;
}

export class MyBookingsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

/** Business-side booking list: same filters plus branch and date scoping. */
export class BusinessBookingsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: 'uuid-of-branch' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: '2026-10-20', description: 'YYYY-MM-DD' })
  @IsOptional()
  @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'YYYY-MM-DD' })
  @IsOptional()
  @Matches(DATE_RE, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'YYYY-MM-DD' })
  @IsOptional()
  @Matches(DATE_RE, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}

/** Business-side status change (confirm, check-in/complete, cancel). */
export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiPropertyOptional({ example: 'Customer did not arrive' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cancellationReason?: string;
}

export class BookingSlotDto {
  @ApiProperty({ example: '14:30' })
  time: string;

  @ApiProperty({ example: true })
  available: boolean;
}

export class BookingAvailabilityDto {
  @ApiProperty({ example: '2026-10-20' })
  date: string;

  @ApiProperty({ example: 'uuid-of-branch' })
  branchId: string;

  @ApiProperty({ example: 'uuid-of-item', nullable: true })
  itemId: string | null;

  @ApiProperty({ example: 30, description: 'Slot grid in minutes' })
  slotMinutes: number;

  @ApiProperty({
    example: 60,
    description: 'Booked service duration in minutes',
  })
  durationMinutes: number;

  @ApiProperty({
    example: false,
    description: 'True when the branch is closed that day',
  })
  isClosed: boolean;

  @ApiProperty({ type: [BookingSlotDto] })
  slots: BookingSlotDto[];
}

export class BookingResponseDto {
  @ApiProperty({ example: 'uuid-of-booking' })
  id: string;

  @ApiProperty({ example: 'BK-4F2A9C' })
  reference: string;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.BOOKED })
  status: BookingStatus;

  @ApiProperty({ example: '2026-10-20' })
  date: string;

  @ApiProperty({ example: '14:30' })
  time: string;

  @ApiProperty({ example: 60 })
  durationMinutes: number;

  @ApiProperty({ example: 'uuid-of-branch' })
  branchId: string;

  @ApiProperty({ example: 'Main Branch', nullable: true })
  branchName: string | null;

  @ApiProperty({ example: 'Patrick Ventures', nullable: true })
  businessName: string | null;

  @ApiPropertyOptional({
    description: 'The booking customer (joined on business-side queries)',
    example: {
      id: 'uuid-of-customer',
      firstName: 'Amina',
      lastName: 'Bello',
      phone: '+2348032198831',
    },
  })
  customer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;

  @ApiProperty({ example: 'uuid-of-item', nullable: true })
  itemId: string | null;

  @ApiProperty({ example: 'Private Event Catering' })
  itemName: string;

  @ApiProperty({ example: 'Window seat if possible', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2026-10-19T10:00:00.000Z', nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ example: 'Change of plans', nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ example: '2026-10-08T19:00:00.000Z' })
  createdAt: Date;
}

export class BookingPageDto {
  @ApiProperty({ type: [BookingResponseDto] })
  data: BookingResponseDto[];

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
