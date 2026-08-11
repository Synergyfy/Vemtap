import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKbSectionDto {
  @ApiProperty({ example: 'POS Setup' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  order?: number = 0;
}

export class UpdateKbSectionDto {
  @ApiPropertyOptional({ example: 'POS Setup' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  order?: number;
}
