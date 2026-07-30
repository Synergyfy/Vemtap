import { ApiProperty } from '@nestjs/swagger';

export class AffiliateStatsDto {
  @ApiProperty({ description: 'Total lifetime earnings', example: 125000 })
  totalEarnings: number;

  @ApiProperty({
    description: 'Balance currently available for withdrawal',
    example: 45000,
  })
  availableBalance: number;

  @ApiProperty({
    description: 'Total number of referred users or businesses',
    example: 24,
  })
  totalReferrals: number;

  @ApiProperty({
    description: 'Number of active/converted referrals',
    example: 18,
  })
  activeReferrals: number;

  @ApiProperty({
    description: 'Referral/invite code for sharing',
    example: 'VEM-JOH-1234',
  })
  referralCode: string;

  @ApiProperty({ description: 'Current tier level', example: 'Bronze' })
  tier: string;
}
