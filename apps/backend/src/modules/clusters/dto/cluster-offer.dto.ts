import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClusterOffersQueryDto {
  @ApiPropertyOptional({ example: 'grill' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class SetClusterOfferPinnedDto {
  @ApiProperty({
    example: true,
    description: 'Pin (true) or unpin (false) the offer',
  })
  @IsBoolean()
  pinned: boolean;
}
