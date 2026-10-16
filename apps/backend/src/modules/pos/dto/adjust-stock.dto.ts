import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @ApiProperty({ example: 18, description: 'New on-hand quantity' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'Shift count correction' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
