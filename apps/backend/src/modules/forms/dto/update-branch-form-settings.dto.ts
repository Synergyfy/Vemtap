import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateBranchFormSettingsDto {

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsString()
  @IsOptional()
  formAppearanceColor?: string;

  @ApiPropertyOptional({ example: 'Quick Link' })
  @IsString()
  @IsOptional()
  welcomeTag?: string;

  @ApiPropertyOptional({ example: 'Connect with us' })
  @IsString()
  @IsOptional()
  welcomeTitle?: string;

  @ApiPropertyOptional({ example: 'Leave your details to stay in touch and earn rewards.' })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiPropertyOptional({ example: 'Visit recorded successfully!' })
  @IsString()
  @IsOptional()
  successTitle?: string;

  @ApiPropertyOptional({ example: 'Thank you for visiting our store' })
  @IsString()
  @IsOptional()
  successDescription?: string;
}
