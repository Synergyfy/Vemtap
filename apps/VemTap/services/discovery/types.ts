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
