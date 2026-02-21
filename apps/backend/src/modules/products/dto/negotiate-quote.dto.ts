import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NegotiateQuoteDto {
  @ApiProperty({ example: 900 })
  @IsNumber()
  @Min(0)
  priceOffered: number;

  @ApiPropertyOptional({ example: 'My final offer.' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Admin only: Can the owner negotiate further?',
  })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;
}
