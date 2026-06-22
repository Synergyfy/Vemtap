import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ApproveVarianceDto {
  @ApiPropertyOptional({ example: 'Variance approved. Stock updated.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectVarianceDto {
  @ApiProperty({ example: 'Need to re-count shelf 3' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
