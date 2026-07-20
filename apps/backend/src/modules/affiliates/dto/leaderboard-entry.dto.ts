import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardEntryDto {
  @ApiProperty({ description: 'Name of the partner or business', example: 'Alice Smith' })
  name: string;

  @ApiProperty({ description: 'Total earnings/points basis', example: 15000 })
  earnings: number;

  @ApiProperty({ description: 'Current leaderboard rank', example: 1 })
  rank: number;

  @ApiPropertyOptional({ description: 'Avatar or logo image URL', example: 'https://cdn.example.com/avatar.png', nullable: true })
  avatar: string | null;

  @ApiPropertyOptional({ description: 'Number of referrals (B2B only)', example: 3 })
  referred?: number;

  @ApiPropertyOptional({ description: 'Referral score points (B2B only)', example: 300 })
  points?: number;
}
