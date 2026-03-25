import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';

export class MessagingThreadFilterDto extends BranchFilterDto {
  @ApiPropertyOptional({ description: 'Filter threads by customer segment' })
  @IsUUID()
  @IsOptional()
  segmentId?: string;
}
