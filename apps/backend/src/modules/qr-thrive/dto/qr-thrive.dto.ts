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
