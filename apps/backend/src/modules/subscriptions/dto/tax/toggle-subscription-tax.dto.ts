import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ToggleSubscriptionTaxDto {
  @ApiProperty({
    example: false,
    description: 'Whether VAT / Tax should be enabled or disabled',
  })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({
    example: 'Temporarily pausing VAT charges during promotional period',
    description: 'Reason for enabling/disabling tax',
  })
  @IsOptional()
  @IsString()
  changeReason?: string;
}
