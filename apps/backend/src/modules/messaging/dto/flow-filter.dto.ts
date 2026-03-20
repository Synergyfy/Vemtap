import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsUUID } from 'class-validator';

export class FlowFilterDto {
  @ApiProperty({ required: false, description: 'Filter by Business ID' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiProperty({ required: false, description: 'Filter by Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({
    required: false,
    description: 'Start date for filtering (ISO format)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    required: false,
    description: 'End date for filtering (ISO format)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({ required: false, description: 'Limit number of results' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
