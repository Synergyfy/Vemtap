import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';
import { Channel } from '../enums/channel.enum';

export class MessagingAnalyticsFilterDto extends BranchFilterDto {
  @ApiPropertyOptional({
    enum: Channel,
    description: 'Filter by specific messaging channel',
    example: Channel.SMS,
  })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;
}
