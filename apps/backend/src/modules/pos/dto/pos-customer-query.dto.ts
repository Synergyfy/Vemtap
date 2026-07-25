import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

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
}
