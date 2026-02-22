import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemRewardDto {
  @ApiProperty({ example: 'reward-uuid-123' })
  @IsNotEmpty()
  @IsString()
  rewardId: string;
}
