import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { Channel } from '../enums/channel.enum';

export class AdjustCreditsDto {
  @ApiProperty({ example: 'uuid-of-business' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ enum: Channel, example: Channel.SMS })
  @IsEnum(Channel)
  channel: Channel;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: ['add', 'remove'], example: 'add' })
  @IsEnum(['add', 'remove'])
  action: 'add' | 'remove';
}
