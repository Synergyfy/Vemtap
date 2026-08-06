import { ApiProperty } from '@nestjs/swagger';

export class DiscoveryAdminStatsResponseDto {
  @ApiProperty()
  totalBusinesses: number;

  @ApiProperty()
  activeOffers: number;

  @ApiProperty()
  scheduledOffers: number;

  @ApiProperty()
  expiredOffers: number;

  @ApiProperty()
  totalOfferViews: number;

  @ApiProperty()
  totalOfferClicks: number;

  @ApiProperty()
  referralsGenerated: number;

  @ApiProperty()
  referralsCompleted: number;

  @ApiProperty()
  couponsRedeemed: number;

  @ApiProperty()
  attributedSales: number;

  @ApiProperty()
  attributedRevenue: number;

  @ApiProperty()
  sponsoredRevenue: number;

  @ApiProperty()
  activePartnerships: number;

  @ApiProperty()
  notificationsSent: number;

  @ApiProperty()
  avgConversionRate: number;
}

export class DiscoveryAdminBusinessesResponseDto {
  @ApiProperty({ type: [Object] })
  data: any[];

  @ApiProperty({ type: Object })
  meta: { total: number };
}

export class AdminOfferResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  businessId: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  clicks: number;

  @ApiProperty()
  visits: number;

  @ApiProperty()
  revenue: number;
}

export class AdminOfferDetailResponseDto extends AdminOfferResponseDto {
  @ApiProperty()
  radius: string;

  @ApiProperty()
  minSpend: number;

  @ApiProperty()
  ctr: string;

  @ApiProperty()
  conversion: string;

  @ApiProperty({ type: [Object] })
  topReferralSources: { name: string; count: number; growth: string }[];
}

export class AdminReferralResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customer: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiProperty()
  offer: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  date: string;
}

export class AdminReferralInvestigationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  confidence: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ type: Object })
  customer: { name: string; id: string; history: string };

  @ApiProperty({ type: Object })
  referral: {
    id: string;
    source: string;
    target: string;
    timestamp: string;
    offer: string;
  };

  @ApiProperty({ type: [Object] })
  evidence: { label: string; val: string; conflict: boolean; note: string }[];
}

export class AdminPartnershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  businessA: string;

  @ApiProperty()
  businessB: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  customersShared: number;

  @ApiProperty()
  revenueGenerated: number;

  @ApiProperty()
  dateCreated: string;
}

export class AdminSponsoredCampaignResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  radius: string;

  @ApiProperty()
  budget: number;

  @ApiProperty()
  spent: number;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  impressions: number;

  @ApiProperty()
  clicks: number;

  @ApiProperty()
  conversions: number;
}

export class AdminSponsoredCampaignDetailResponseDto extends AdminSponsoredCampaignResponseDto {
  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  ctr: string;

  @ApiProperty()
  cpc: string;

  @ApiProperty({ type: [Object] })
  transactions: {
    invoiceNo: string;
    date: string;
    type: string;
    amount: number;
    status: string;
  }[];

  @ApiProperty({ type: [Object] })
  auditLog: { action: string; admin: string; time: string; detail: string }[];
}

export class AdminBillingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  method: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  date: string;
}

export class AdminBillingDetailResponseDto extends AdminBillingResponseDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ type: [Object] })
  items: { desc: string; qty: number; price: number }[];

  @ApiProperty()
  tax: number;

  @ApiProperty()
  total: number;
}

export class AdminAttributionResponseDto {
  @ApiProperty({ type: [Object] })
  paths: {
    from: string;
    to: string;
    flow: number;
    conversion: string;
    revenue: string;
  }[];

  @ApiProperty()
  window: number;

  @ApiProperty({ type: Object })
  metrics: {
    attributedVisits: number;
    attributedPurchases: number;
    attributedRevenue: string;
    avgAttributionTime: string;
  };
}

export class AdminCustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalReferrals: number;

  @ApiProperty()
  redeemedOffers: number;

  @ApiProperty()
  lastActive: string;

  @ApiProperty({ type: [String] })
  preferences: string[];
}

export class AdminCustomerDetailResponseDto extends AdminCustomerResponseDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  optInDate: string;

  @ApiProperty({ type: Object })
  stats: {
    totalVisits: number;
    offersReceived: number;
    offersRedeemed: number;
    totalReferrals: number;
    totalSpend: number;
  };

  @ApiProperty({ type: [Object] })
  activityTimeline: {
    action: string;
    via: string;
    time: string;
    val: string | null;
  }[];
}

export class AdminLocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  businesses: number;

  @ApiProperty()
  offers: number;

  @ApiProperty()
  referrals: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  growth: string;
}

export class AdminLocationDetailResponseDto extends AdminLocationResponseDto {
  @ApiProperty()
  city: string;

  @ApiProperty()
  density: string;

  @ApiProperty()
  conversionRate: string;
}

export class AdminCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  referrals: number;

  @ApiProperty()
  conversion: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  topOffer: string;
}

export class AdminCategoryDetailResponseDto extends AdminCategoryResponseDto {
  @ApiProperty()
  totalBusinesses: number;

  @ApiProperty()
  activeOffers: number;

  @ApiProperty()
  avgTicketSize: string;

  @ApiProperty()
  penetration: string;
}

export class AdminFraudResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  customer: string;

  @ApiProperty()
  severity: string;

  @ApiProperty()
  confidence: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  reason: string;
}

export class AdminFraudDashboardDto {
  @ApiProperty()
  securityScore: string;

  @ApiProperty()
  activeAlerts: number;

  @ApiProperty()
  fraudPrevented: string;

  @ApiProperty()
  suspiciousUsers: number;

  @ApiProperty({ type: [AdminFraudResponseDto] })
  alerts: AdminFraudResponseDto[];
}

export class AdminNotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  recipient: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  channel: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  openStatus: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  content: string;
}

export class AdminReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  size: string;
}

export class AdminAuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  admin: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  target: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  ip: string;
}

export class AdminAuditLogDetailResponseDto extends AdminAuditLogResponseDto {
  @ApiProperty()
  module: string;

  @ApiProperty()
  device: string;

  @ApiProperty({ type: Object })
  changes: { before: Record<string, any>; after: Record<string, any> };
}

export class AdminSettingResponseDto {
  @ApiProperty()
  enableNetwork: boolean;

  @ApiProperty()
  enableSponsored: boolean;

  @ApiProperty()
  enablePartnerships: boolean;

  @ApiProperty()
  maxOffersPerVisit: number;

  @ApiProperty()
  maxOffersPerDay: number;

  @ApiProperty()
  defaultRadius: number;

  @ApiProperty()
  maxRadius: number;

  @ApiProperty()
  attributionWindow: number;

  @ApiProperty()
  pushEnabled: boolean;

  @ApiProperty()
  smsEnabled: boolean;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  approvalRequired: boolean;
}
