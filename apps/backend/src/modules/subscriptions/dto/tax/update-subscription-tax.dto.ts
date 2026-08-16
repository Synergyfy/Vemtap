import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxType } from '../../entities/subscription-tax-config.entity';

export class UpdateSubscriptionTaxDto {
  @ApiPropertyOptional({
    example: 'VAT',
    description: 'Display name/label for the tax (default: VAT)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    enum: TaxType,
    example: TaxType.PERCENTAGE,
    description: 'Type of tax calculation: percentage or fixed',
  })
  @IsEnum(TaxType)
  taxType: TaxType;

  @ApiProperty({
    example: 7.5,
    description: 'Tax rate (percentage or fixed amount in NGN)',
  })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiProperty({
    example: true,
    description: 'Whether tax is enabled and charged at checkout',
  })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({
    example: 'Adjusted VAT according to latest financial regulations',
    description: 'Reason or note for changing the tax rule',
  })
  @IsOptional()
  @IsString()
  changeReason?: string;
}
