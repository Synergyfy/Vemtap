import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCustomerCaptureDto {
  @ApiPropertyOptional({ description: 'Persisted QR presentation settings' })
  @IsOptional()
  @IsObject()
  qrData?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Persisted customer capture form settings',
  })
  @IsOptional()
  @IsObject()
  formConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  shortLink?: string;
}
