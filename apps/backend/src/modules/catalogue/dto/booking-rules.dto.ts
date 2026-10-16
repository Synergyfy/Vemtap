import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

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
}

export type BookingRules = {
  [K in keyof BookingRulesDto]: BookingRulesDto[K];
};
