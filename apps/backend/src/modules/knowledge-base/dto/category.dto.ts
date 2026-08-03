import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKbCategoryDto {
  @ApiProperty({ example: 'Getting Started' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  order?: number = 0;
}

export class UpdateKbCategoryDto {
  @ApiPropertyOptional({ example: 'Getting Started' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  order?: number;
}
