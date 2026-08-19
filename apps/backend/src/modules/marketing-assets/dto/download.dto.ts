import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export enum DownloadFormat {
  PDF = 'pdf',
  PNG = 'png',
  SVG = 'svg',
  JPEG = 'jpeg',
}

export class RecordDownloadDto {
  @ApiProperty({
    description: 'File format of the downloaded marketing asset',
    example: DownloadFormat.PDF,
    enum: DownloadFormat,
  })
  @IsEnum(DownloadFormat)
  @IsNotEmpty()
  format: DownloadFormat;
}

export class FindDownloadsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter download events by marketing asset ID (UUID)',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
  )
  @IsUUID('4', { message: 'assetId must be a valid UUID v4' })
  assetId?: string;
}
