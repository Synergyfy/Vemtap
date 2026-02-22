import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductTypeDto {
  @ApiProperty({ example: 'NFC Card' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Standard plastic NFC card' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'nfc-card' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
