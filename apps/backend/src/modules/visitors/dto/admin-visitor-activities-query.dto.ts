import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminVisitorActivitiesQueryDto {
  @ApiProperty({
    required: false,
    description: 'Search by visitor name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by branch ID',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by business ID',
  })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
