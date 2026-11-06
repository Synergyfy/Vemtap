import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimReferralDto {
  @ApiProperty({
    example: 'VEM-8OGUU4',
    description: 'Referral code to claim for this account',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
