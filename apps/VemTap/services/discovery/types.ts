export interface DiscoveryStats {
  peopleReached: number;
  customersVisited: number;
  offersRedeemed: number;
  revenueGenerated: number;
}

export interface DiscoveryHighlightItem {
  name: string;
  visits: number;
}

export interface DiscoveryHighlights {
  bestPromotion: DiscoveryHighlightItem;
  topPartner: DiscoveryHighlightItem;
}

export interface DiscoveryRecentVisit {
  name: string;
  time: string;
  promo: string;
}

export interface DiscoveryOverviewResponse {
  stats: DiscoveryStats;
  highlights: DiscoveryHighlights;
  recentVisits: DiscoveryRecentVisit[];
}

export interface DiscoveryResultsStats {
  peopleReached: number;
  interested: number;
  visits: number;
  redeemed: number;
  revenue: number;
}

export interface DiscoveryTimelineEntry {
  name: string;
  views: number;
  visits: number;
}

export interface DiscoveryResultsResponse {
  stats: DiscoveryResultsStats;
  timeline: DiscoveryTimelineEntry[];
}

export interface DiscoverySettingsResponse {
  id: string;
  joinDiscoveryNetwork: boolean;
  receivePartnerRequests: boolean;
  allowPromotions: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
  emailSummary: boolean;
}

export interface UpdateDiscoverySettingsDto {
  joinDiscoveryNetwork?: boolean;
  receivePartnerRequests?: boolean;
  allowPromotions?: boolean;
  pushNotifications?: boolean;
  smsAlerts?: boolean;
  emailSummary?: boolean;
}

export interface ActivePartner {
  id: string;
  partnerBranchId: string;
  name: string;
  businessName: string;
  type: string;
  sent: number;
  received: number;
}

export type ActivePartnersList = ActivePartner[];

export type DiscoveryCustomerOrigin = 'from_partners' | 'sent_to_partners' | 'direct';

export interface DiscoveryCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  origin: string;
  date: string;
  promo: string;
  status: 'Purchased' | 'Visited';
}

export interface PaginatedDiscoveryCustomersResponse {
  data: DiscoveryCustomer[];
  total: number;
  page: number;
  limit: number;
}

export interface RecommendBusinessDto {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  reason?: string;
}

export interface RecommendBusinessResponse {
  success: boolean;
  message: string;
  data: {
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    address?: string;
    reason?: string;
  };
}

export interface NearbyPartner {
  id: string;
  name: string;
  businessName: string;
  type: string;
  distance: string;
  distanceInMeters?: number;
  latitude?: number;
  longitude?: number;
}

export interface NearbyPartnersResponse {
  data: NearbyPartner[];
  total: number;
  page: number;
  limit: number;
}

export type PartnershipStatus = 'Pending' | 'Accepted' | 'Declined';

export interface PartnershipBranch {
  id: string;
  name: string;
  business?: {
    id: string;
    name: string;
    category?: string;
  };
}

export interface PartnershipInvitation {
  id: string;
  initiatorBranchId: string;
  recipientBranchId: string;
  initiatorBranch: PartnershipBranch;
  recipientBranch: PartnershipBranch;
  status: PartnershipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPartnershipInvitationsResponse {
  data: PartnershipInvitation[];
  total: number;
  page: number;
  limit: number;
}

export interface InvitePartnershipDto {
  initiatorBranchId: string;
  recipientBranchId: string;
}

// =============== ADMIN TYPES ===============

export interface AdminPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface AdminOffer {
  id: string;
  name: string;
  business: string;
  businessId: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  visits: number;
  revenue: number;
}

export interface AdminOfferDetail extends AdminOffer {
  radius: string;
  minSpend: number;
  ctr: string;
  conversion: string;
  topReferralSources: { name: string; count: number; growth: string }[];
}

export interface AdminReferral {
  id: string;
  customer: string;
  source: string;
  target: string;
  offer: string;
  status: string;
  revenue: number;
  date: string;
}

export interface AdminReferralInvestigation {
  id: string;
  status: string;
  confidence: string;
  reason: string;
  customer: { name: string; id: string; history: string };
  referral: { id: string; source: string; target: string; timestamp: string; offer: string };
  evidence: { label: string; val: string; conflict: boolean; note: string }[];
}

export interface AdminPartnership {
  id: string;
  businessA: string;
  businessB: string;
  status: string;
  customersShared: number;
  revenueGenerated: number;
  dateCreated: string;
}

export interface AdminSponsoredCampaign {
  id: string;
  business: string;
  name: string;
  radius: string;
  budget: number;
  spent: number;
  duration: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface AdminSponsoredCampaignDetail extends AdminSponsoredCampaign {
  startDate: string;
  endDate: string;
  ctr: string;
  cpc: string;
  transactions: { invoiceNo: string; date: string; type: string; amount: number; status: string }[];
  auditLog: { action: string; admin: string; time: string; detail: string }[];
}

export interface AdminBillingTransaction {
  id: string;
  business: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  date: string;
}

export interface AdminBillingDetail extends AdminBillingTransaction {
  description: string;
  items: { desc: string; qty: number; price: number }[];
  tax: number;
  total: number;
}

export interface AdminAttribution {
  paths: { from: string; to: string; flow: number; conversion: string; revenue: string }[];
  window: number;
  metrics: { attributedVisits: number; attributedPurchases: number; attributedRevenue: string; avgAttributionTime: string };
}

export interface AdminCustomer {
  id: string;
  name: string;
  location: string;
  status: string;
  totalReferrals: number;
  redeemedOffers: number;
  lastActive: string;
  preferences: string[];
}

export interface AdminCustomerDetail extends AdminCustomer {
  email: string;
  phone: string;
  optInDate: string;
  stats: { totalVisits: number; offersReceived: number; offersRedeemed: number; totalReferrals: number; totalSpend: number };
  activityTimeline: { action: string; via: string; time: string; val: string | null }[];
}

export interface AdminLocation {
  id: string;
  name: string;
  businesses: number;
  offers: number;
  referrals: number;
  revenue: number;
  growth: string;
}

export interface AdminLocationDetail extends AdminLocation {
  city: string;
  density: string;
  conversionRate: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  referrals: number;
  conversion: string;
  revenue: number;
  topOffer: string;
}

export interface AdminCategoryDetail extends AdminCategory {
  totalBusinesses: number;
  activeOffers: number;
  avgTicketSize: string;
  penetration: string;
}

export interface AdminCategoryType {
  id: string;
  name: string;
  desc: string;
  count: number;
  status: string;
}

export interface AdminFraudAlert {
  id: string;
  type: string;
  business: string;
  customer: string;
  severity: string;
  confidence: string;
  status: string;
  date: string;
  reason: string;
}

export interface AdminFraudDashboard {
  securityScore: string;
  activeAlerts: number;
  fraudPrevented: string;
  suspiciousUsers: number;
  alerts: AdminFraudAlert[];
}

export interface AdminNotification {
  id: string;
  recipient: string;
  business: string;
  channel: string;
  status: string;
  openStatus: string;
  date: string;
  content: string;
}

export interface AdminReport {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  size: string;
}

export interface AdminAuditLog {
  id: string;
  admin: string;
  action: string;
  target: string;
  business: string;
  status: string;
  date: string;
  ip: string;
}

export interface AdminAuditLogDetail extends AdminAuditLog {
  module: string;
  device: string;
  changes: { before: Record<string, any>; after: Record<string, any> };
}

export interface AdminStatsResponse {
  totalBusinesses: number;
  activeOffers: number;
  scheduledOffers: number;
  expiredOffers: number;
  totalOfferViews: number;
  totalOfferClicks: number;
  referralsGenerated: number;
  referralsCompleted: number;
  couponsRedeemed: number;
  attributedSales: number;
  attributedRevenue: number;
  sponsoredRevenue: number;
  activePartnerships: number;
  notificationsSent: number;
  avgConversionRate: number;
}

export interface AdminBusinessesResponse {
  data: any[];
  meta: { total: number };
}

export interface AdminDiscoverySettings {
  enableNetwork: boolean;
  enableSponsored: boolean;
  enablePartnerships: boolean;
  maxOffersPerVisit: number;
  maxOffersPerDay: number;
  defaultRadius: number;
  maxRadius: number;
  attributionWindow: number;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  approvalRequired: boolean;
}
