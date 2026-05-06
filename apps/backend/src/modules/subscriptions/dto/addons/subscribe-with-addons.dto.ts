import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsOptional,
} from 'class-validator';
import { SubscribeDto } from '../subscribe.dto';

export class SubscribeWithAddonsDto extends SubscribeDto {
  @ApiPropertyOptional({
    description:
      'IDs of add-ons to purchase alongside this subscription (combined single payment)',
    example: ['uuid-addon-1', 'uuid-addon-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addonIds?: string[];

  @ApiPropertyOptional({
    description:
      'Quantities for each purchased add-on (must match addonIds length)',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  addonQuantities?: number[];
}