import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class VisitorGrowthQueryDto {
  @ApiProperty({
    example: '7D',
    enum: ['7D', '30D', '90D', '12M'],
    required: false,
    description: 'Time range for growth chart aggregation',
  })
  @IsOptional()
  @IsString()
  @IsIn(['7D', '30D', '90D', '12M'])
  range?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  allBranches?: boolean;
}

export class VisitorGrowthPointDto {
  @ApiProperty({ example: 'Mon' })
  name: string;

  @ApiProperty({ example: 450 })
  customers: number;
}

export class VisitorGrowthResponseDto {
  @ApiProperty({ example: '7D' })
  range: string;

  @ApiProperty({ type: [VisitorGrowthPointDto] })
  data: VisitorGrowthPointDto[];
}
