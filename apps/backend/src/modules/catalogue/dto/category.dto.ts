import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCatalogueCategoryDto {
  @ApiProperty({ example: 'Food' })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateCatalogueCategoryDto {
  @ApiPropertyOptional({ example: 'Drinks' })
  @IsOptional()
  @IsString()
  name?: string;
}
