import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/**
 * - `vip`: 10+ visits or ₦100,000+ spent at this business.
 * - `new`: first visit in the last 30 days.
 * - `lapsed`: no visit in the last 60 days.
 */
export enum PosCustomerSegment {
  VIP = 'vip',
  NEW = 'new',
  LAPSED = 'lapsed',
}

export class PosCustomerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Search by name, email, or phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PosCustomerSegment })
  @IsOptional()
  @IsEnum(PosCustomerSegment)
  segment?: PosCustomerSegment;
}
