import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateMockupDto {
  @ApiProperty({ example: 'Wooden Table Stand Mockup' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'table_tent' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'https://cdn.vemtap.com/mockups/wooden-table.png' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'Overlay coordinates and perspective matrix JSON',
  })
  @IsObject()
  @IsNotEmpty()
  overlayConfig: any;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
