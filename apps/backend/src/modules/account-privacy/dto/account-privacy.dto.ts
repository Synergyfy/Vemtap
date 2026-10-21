import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAccountPrivacyDto {
  @ApiPropertyOptional({
    example: false,
    description:
      'Business-wide: stop all optional AI processing of the business’s data',
  })
  @IsOptional()
  @IsBoolean()
  restrictProcessing?: boolean;

  @ApiPropertyOptional({
    example: true,
    description:
      'Business-wide: allow AI analysis of the business’s dashboards',
  })
  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Your own: VemTap marketing notifications',
  })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Your own: email me when a new device signs in',
  })
  @IsOptional()
  @IsBoolean()
  deviceAlerts?: boolean;
}

export class AccountPrivacyDto {
  @ApiProperty({ example: false })
  restrictProcessing: boolean;

  @ApiProperty({ example: true })
  analytics: boolean;

  @ApiProperty({ example: true })
  marketing: boolean;

  @ApiProperty({ example: false })
  deviceAlerts: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the caller may change the business-wide fields',
  })
  canManageBusiness: boolean;
}

export class CreateDataRequestDto {
  @ApiProperty({ enum: ['rectification'], example: 'rectification' })
  @IsIn(['rectification'])
  type: 'rectification';

  @ApiProperty({
    example: 'The registered business address on my invoices is out of date.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  details: string;
}

export class DataExportFileDto {
  @ApiProperty({ example: 'vemtap-data-export-2026-10-21.json' })
  fileName: string;

  @ApiProperty({ example: 'application/json' })
  mimeType: string;

  @ApiProperty({ description: 'The archive, base64-encoded' })
  content: string;

  @ApiProperty({ example: 'DR-7KX2P9Q4' })
  reference: string;
}
