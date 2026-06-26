import { ApiProperty } from '@nestjs/swagger';

export class DiscoveryAdminStatsResponseDto {
  @ApiProperty({ example: 124, description: 'Total active participating businesses' })
  totalBusinesses: number;

  @ApiProperty({ example: 342, description: 'Total active promotions/offers on the network' })
  activeOffers: number;

  @ApiProperty({ example: 45, description: 'Total scheduled future promotions' })
  scheduledOffers: number;

  @ApiProperty({ example: 89, description: 'Total expired promotions' })
  expiredOffers: number;

  @ApiProperty({ example: 12540, description: 'Cumulative views of all catalogue offers' })
  totalOfferViews: number;

  @ApiProperty({ example: 3420, description: 'Cumulative visits/clicks driven by offers' })
  totalOfferClicks: number;

  @ApiProperty({ example: 856, description: 'Total referrals generated' })
  referralsGenerated: number;

  @ApiProperty({ example: 234, description: 'Total patronage visits referred by partners' })
  referralsCompleted: number;

  @ApiProperty({ example: 189, description: 'Total coupons/offers successfully redeemed' })
  couponsRedeemed: number;

  @ApiProperty({ example: 156, description: 'Total sales attributed to referrals' })
  attributedSales: number;

  @ApiProperty({ example: 2450000, description: 'Total revenue in NGN generated from partner referrals' })
  attributedRevenue: number;

  @ApiProperty({ example: 0, description: 'Total sponsored revenue' })
  sponsoredRevenue: number;

  @ApiProperty({ example: 64, description: 'Total accepted/active partnerships' })
  activePartnerships: number;

  @ApiProperty({ example: 4520, description: 'Total notifications sent' })
  notificationsSent: number;

  @ApiProperty({ example: 2.8, description: 'Average referral conversion rate (percentage)' })
  avgConversionRate: number;
}

export class DiscoveryAdminBusinessResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Business ID' })
  id: string;

  @ApiProperty({ example: 'Fashion Hub', description: 'Business Name' })
  name: string;

  @ApiProperty({ example: 'Fashion', description: 'Primary business category name' })
  category: string;

  @ApiProperty({ example: 'Premium', description: 'Current active subscription plan name' })
  plan: string;

  @ApiProperty({ example: 'Wuse 2', description: 'Main branch city/district' })
  location: string;

  @ApiProperty({ example: 'active', description: 'Current status of the business' })
  status: string;

  @ApiProperty({ example: 5, description: 'Number of active offers' })
  activeOffers: number;

  @ApiProperty({ example: 42, description: 'Number of referrals sent from this business' })
  referralsSent: number;

  @ApiProperty({ example: 28, description: 'Number of referrals received by this business' })
  referralsReceived: number;

  @ApiProperty({ example: 145000, description: 'Revenue in NGN generated from referrals' })
  revenueGenerated: number;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z', description: 'Date the business joined' })
  dateJoined: Date;
}

export class DiscoveryAdminBusinessesResponseDto {
  @ApiProperty({ type: [DiscoveryAdminBusinessResponseDto], description: 'List of businesses with discovery details' })
  data: DiscoveryAdminBusinessResponseDto[];

  @ApiProperty({
    example: { total: 2 },
    description: 'Pagination metadata metadata',
  })
  meta: {
    total: number;
  };
}
