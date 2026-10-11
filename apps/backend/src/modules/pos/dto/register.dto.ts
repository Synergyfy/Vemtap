import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class OpenRegisterDto {
  @ApiProperty({ example: 50000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  openingCash: number;
}

/**
 * Cash counted in the drawer at close.
 *
 * Optional so a shift can still be closed without reading the till, but
 * supplying it is the point: without it `variance` cannot be computed, and the
 * closing notification would be reporting a balanced drawer it never counted.
 */
export class CloseRegisterDto {
  @ApiPropertyOptional({
    description:
      'Physical cash counted in the drawer at close. Omit to close without reconciling.',
    example: 342850,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  countedCash?: number;
}

export class RegisterHistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
