import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class EarnPointsDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Purchase', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
