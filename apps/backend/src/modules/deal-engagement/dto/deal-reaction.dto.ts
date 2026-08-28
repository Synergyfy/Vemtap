import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DealReactionType } from '../entities/deal-reaction.entity';

export class DealReactionDto {
  @ApiProperty({ enum: DealReactionType, example: DealReactionType.LIKE })
  @IsEnum(DealReactionType)
  type: DealReactionType;
}
