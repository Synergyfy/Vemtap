import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Channel } from '../../messaging/enums/channel.enum';

export class AdminSendMessageDto {
  @ApiProperty({ description: 'The message content' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: Channel, description: 'The messaging channel' })
  @IsEnum(Channel)
  @IsNotEmpty()
  channel: Channel;
}

export class AdminSendRewardDto {
  @ApiProperty({ description: 'The ID of the reward to send' })
  @IsUUID()
  @IsNotEmpty()
  rewardId: string;
}

export class SendCampaignDto {
  @ApiProperty({ enum: Channel, description: 'The messaging channel' })
  @IsEnum(Channel)
  @IsNotEmpty()
  channel: Channel;

  @ApiProperty({ description: 'The campaign message' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
