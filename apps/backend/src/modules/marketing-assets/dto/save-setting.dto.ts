import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveSettingDto {
  @ApiProperty({ example: 'ai_daily_limit' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: '50' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'number', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'Daily AI generation limit per business', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
