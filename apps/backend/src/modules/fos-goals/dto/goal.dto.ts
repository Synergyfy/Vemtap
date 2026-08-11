import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: 'Reach 400 Businesses' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 400 })
  @IsNumber()
  @Min(0)
  target: number;

  @ApiPropertyOptional({ example: 342 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current?: number;

  @ApiPropertyOptional({ example: '2026-10-18' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: 'Growth' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateGoalDto {
  @ApiPropertyOptional({ example: 'Reach 400 Businesses' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 400 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  target?: number;

  @ApiPropertyOptional({ example: 342 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current?: number;

  @ApiPropertyOptional({ example: '2026-10-18' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: 'Growth' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateProjectDto {
  @ApiProperty({ example: 'QRThrive V2 Launch' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ example: 320000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spent?: number;

  @ApiPropertyOptional({ example: 850000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @ApiPropertyOptional({ example: 'IN_PROGRESS' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'QRThrive V2 Launch' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ example: 320000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spent?: number;

  @ApiPropertyOptional({ example: 850000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
