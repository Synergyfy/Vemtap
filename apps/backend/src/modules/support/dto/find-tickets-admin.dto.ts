import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketType } from '../entities/support-ticket.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class FindTicketsAdminDto extends PaginationQueryDto {
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
}
