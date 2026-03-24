import { IsEnum, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketType } from '../entities/support-ticket.entity';

export class FindTicketsAdminDto {
  @ApiPropertyOptional({
    enum: TicketType,
    description: 'Filter by ticket type',
  })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @ApiPropertyOptional({ description: 'Filter by assignment status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isAssigned?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
