import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'VemTap', required: false })
  @IsString()
  @IsOptional()
  platformName?: string;

  @ApiProperty({ example: 'support@VemTap.com', required: false })
  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @ApiProperty({ example: 'NGN', required: false })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiProperty({ example: 'Africa/Lagos', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  enforce2FA?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  passwordExpiry?: boolean;

  @ApiProperty({ example: 0.05, required: false })
  @IsNumber()
  @IsOptional()
  messagingCostSms?: number;

  @ApiProperty({ example: 0.08, required: false })
  @IsNumber()
  @IsOptional()
  messagingCostWhatsapp?: number;

  @ApiProperty({ example: 0.01, required: false })
  @IsNumber()
  @IsOptional()
  messagingCostEmail?: number;
}
