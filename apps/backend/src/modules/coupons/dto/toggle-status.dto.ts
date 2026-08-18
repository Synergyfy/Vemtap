import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleStatusDto {
  @ApiPropertyOptional({
    description: 'Explicitly set active status (if omitted, toggles current value)',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
