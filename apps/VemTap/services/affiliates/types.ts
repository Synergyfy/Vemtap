export interface AffiliateStats {
  totalEarnings: number;
  availableBalance: number;
  totalReferrals: number;
  activeReferrals: number;
  referralCode: string;
  tier: string;
}

export interface AffiliateActivity {
  type: 'referral' | 'commission' | 'withdrawal';
  title: string;
  desc: string;
  time: string;
}

export interface AffiliatePerformance {
  name: string;
  earnings: number;
}

export interface LeaderboardEntry {
  name: string;
  earnings: number;
  rank: number;
  avatar: string | null;
  referred?: number;
  points?: number;
}

export interface AffiliateProfile {
  id: string;
  userId: string;
  referralCode: string;
  totalEarnings: number;
  availableBalance: number;
  withdrawalsCount: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  kycStatus: 'unverified' | 'pending' | 'verified';
  idType?: string;
  idNumber?: string;
  idImageUrl?: string;
  bankAccountDetails?: Record<string, any>;
  completedModules: string[];
  trainingScore: number;
  isFlagged: boolean;
  fraudReason?: string;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredBusinessId?: string;
  referredUserId?: string;
  status: 'Pending' | 'Converted' | 'Expired';
  convertedAt?: string;
  createdAt: string;
  referredBusiness?: any;
  referredUser?: any;
}

export interface UpdateProfileData {
  idType?: string;
  idNumber?: string;
  idImageUrl?: string;
  bankAccountDetails?: Record<string, any>;
}

export interface AdminAffiliateStats {
  totalAffiliates: number;
  totalCommissions: number;
  pendingPayouts: number;
  approvedPayouts: number;
  completedPayouts: number;
  totalReferrals: number;
  activeAffiliates: number;
  fraudAlerts: number;
  estimatedRevenue: number;
}

export interface AdminWithdrawalRequest {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  bankDetails?: any;
  createdAt: string;
  processedAt?: string;
  affiliate?: {
    id: string;
    referralCode: string;
    user?: { firstName: string; lastName: string; email: string; phone: string };
  };
}

export interface AdminAffiliateCommission {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  description: string;
  createdAt: string;
  affiliate?: {
    referralCode: string;
    user?: { firstName: string; lastName: string };
  };
}

export interface SystemSettings {
  affiliateDirectCommission: number;
  affiliateIndirectCommission: number;
  affiliateCommissionDurationMonths: number;
  affiliateMinimumWithdrawal: number;
  discoveryEnableNetwork: boolean;
  discoveryEnableSponsored: boolean;
  discoveryEnablePartnerships: boolean;
  discoveryMaxOffersPerVisit: number;
  discoveryMaxOffersPerDay: number;
  discoveryDefaultRadius: number;
  discoveryMaxRadius: number;
  discoveryAttributionWindow: number;
  [key: string]: any;
}
