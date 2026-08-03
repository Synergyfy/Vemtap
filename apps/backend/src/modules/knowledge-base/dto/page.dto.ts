import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKbPageDto {
  @ApiProperty({ example: 'Introduction to POS' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'pos/getting-started' })
  @IsNotEmpty()
  @IsString()
  path: string;

  @ApiProperty({ example: 'A brief guide on setting up your POS device.' })
  @IsNotEmpty()
  @IsString()
  summary: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({
    example: [
      { type: 'heading', text: 'Step 1' },
      { type: 'text', text: 'Turn on device' },
      { type: 'steps', items: ['Connect power', 'Press button'] },
      { type: 'image', url: 'https://example.com/img.png', caption: 'Button' },
    ],
  })
  @IsArray()
  blocks: Record<string, any>[];

  @ApiPropertyOptional({ example: ['Ensure power source is grounded'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tips?: string[];

  @ApiProperty({ example: 'uuid-of-category' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'uuid-of-section' })
  @IsNotEmpty()
  @IsUUID()
  sectionId: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  order?: number = 0;
}

export class UpdateKbPageDto {
  @ApiPropertyOptional({ example: 'Introduction to POS' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'pos/getting-started' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ example: 'A brief guide on setting up your POS device.' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  blocks?: Record<string, any>[];

  @ApiPropertyOptional({ example: ['Ensure power source is grounded'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tips?: string[];

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-section' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  order?: number;
}
