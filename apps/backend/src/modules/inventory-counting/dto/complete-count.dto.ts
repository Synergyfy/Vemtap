import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CompleteCountDto {
  @ApiPropertyOptional({ example: 'All items counted. Some variances found on shelf 2.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
