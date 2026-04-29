import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';
import { QRType } from '../enums';

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

export class ToggleUblFeatureDto {
  @ApiProperty({ example: true, description: 'Whether the QR code is featured on the branch UBL profile' })
  @IsBoolean()
  @IsNotEmpty()
  isFeatured: boolean;
}
