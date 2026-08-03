import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './pagination.dto';

export class CursorPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Base64 encoded pagination cursor' })
  @IsOptional()
  @IsString()
  declare cursor?: string;

  @ApiPropertyOptional({ description: 'Alias for pagination cursor' })
  @IsOptional()
  @IsString()
  declare nextCursor?: string;
}
