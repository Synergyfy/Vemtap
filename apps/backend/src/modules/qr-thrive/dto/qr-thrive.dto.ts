import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { QRType } from '../enums';
import { ExternalLeadStatus } from '../entities/external-lead-status.entity';

export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: ExternalLeadStatus,
    example: ExternalLeadStatus.PROCESSING,
  })
  @IsEnum(ExternalLeadStatus)
  @IsNotEmpty()
  status: ExternalLeadStatus;

  @ApiPropertyOptional({ example: 'Customer called to confirm' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SyncUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class CreateQRCodeDto {
  @ApiProperty({ example: 'My Awesome QR' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'A brief description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-folder' })
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiProperty({ enum: QRType, example: QRType.url })
  @IsEnum(QRType)
  @IsNotEmpty()
  type: QRType;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDynamic?: boolean;

  @ApiProperty({ example: { url: 'https://example.com' } })
  @IsObject()
  @IsNotEmpty()
  data: any;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  design?: any;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  frame?: any;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;
}
export class UpdateQRCodeDto {
  @ApiPropertyOptional({ example: 'Updated QR Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-folder' })
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ enum: QRType, example: QRType.url })
  @IsEnum(QRType)
  @IsOptional()
  type?: QRType;

  @ApiPropertyOptional({ example: { url: 'https://new-example.com' } })
  @IsObject()
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  design?: any;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  frame?: any;

  @ApiPropertyOptional({ example: 'https://example.com/new-logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsString()
  @IsOptional()
  status?: 'active' | 'archived';
}

export class CreateFolderDto {
  @ApiProperty({ example: 'My QR Codes' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateFolderDto {
  @ApiPropertyOptional({ example: 'Personal QR Codes' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '#00FF00' })
  @IsString()
  @IsOptional()
  color?: string;
}

export class SpecializedLeadsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by types (comma-separated): booking, menu, form',
    example: 'booking,menu',
  })
  @IsString()
  @IsOptional()
  types?: string;

  @ApiPropertyOptional({
    description: 'Filter by a specific QR code (UUID or shortId)',
    example: 'qr-uuid-123',
  })
  @IsString()
  @IsOptional()
  qrCodeId?: string;

  @ApiPropertyOptional({
    description: 'Search text for QR Name or Booking/Menu Title',
    example: 'Christmas',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page for pagination',
    example: 10,
  })
  @IsOptional()
  limit?: number;
}
