import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetItemDto {
  @ApiProperty({ example: 'Revenue' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Subscription Revenue' })
  @IsString()
  @IsNotEmpty()
  item: string;

  @ApiProperty({ example: 2800000 })
  @IsNumber()
  @Min(0)
  planned: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual?: number;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBudgetItemDto {
  @ApiPropertyOptional({ example: 'Revenue' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Subscription Revenue' })
  @IsOptional()
  @IsString()
  item?: string;

  @ApiPropertyOptional({ example: 2800000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  planned?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual?: number;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBudgetCategoryDto {
  @ApiProperty({ example: 'Marketing' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateAspectDto {
  @ApiProperty({ example: 'Sales Revenue' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 2847500 })
  @IsNumber()
  @Min(0)
  baseValue: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  growthRate?: number;
}

export class UpdateAspectDto {
  @ApiPropertyOptional({ example: 'Sales Revenue' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 2847500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseValue?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  growthRate?: number;
}

export class PlanningPageQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  perPage?: number = 100;
}
