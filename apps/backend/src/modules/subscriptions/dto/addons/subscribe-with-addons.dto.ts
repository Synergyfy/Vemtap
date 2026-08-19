import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { SubscribeDto } from '../subscribe.dto';

export class SubscribeWithAddonsDto extends SubscribeDto {
  @ApiPropertyOptional({
    description:
      'IDs of add-ons to purchase alongside this subscription (combined single payment)',
    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const parts = value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return parts.length > 0 ? parts : undefined;
    }
    if (Array.isArray(value)) {
      const filtered = value
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.trim());
      return filtered.length > 0 ? filtered : undefined;
    }
    return undefined;
  })
  addonIds?: string[];

  @ApiPropertyOptional({
    description:
      'Quantities for each purchased add-on (must match addonIds length)',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const parts = value
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      return parts.length > 0 ? parts : undefined;
    }
    if (Array.isArray(value)) {
      const mapped = value
        .map((v) => (typeof v === 'number' ? v : parseInt(String(v).trim(), 10)))
        .filter((n) => !isNaN(n));
      return mapped.length > 0 ? mapped : undefined;
    }
    return undefined;
  })
  addonQuantities?: number[];
}
