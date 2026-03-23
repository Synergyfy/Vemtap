export type PointTransactionType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
export type RewardType = 'custom_discount' | 'free_product' | 'service_upgrade' | 'tangible_gifts' | 'discount' | 'free_item' | 'service' | 'cashback' | 'gift';
export type RedemptionStatus = 'pending' | 'verified' | 'used' | 'expired' | 'cancelled';
export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type RuleType = 'spending' | 'visit' | 'hybrid';
export type ExpiryType = 'none' | 'fixed' | 'rolling';
export type FraudType = 'rapid_taps' | 'duplicate_device' | 'gps_spoof' | 'suspicious_pattern';

export interface LoyaltyProfile {
  id: string;
  userId: string;
  businessId: string;
  totalPointsEarned: number;
  currentPointsBalance: number;
  pointsRedeemed: number;
  tierLevel: TierLevel;
  lastVisitDate: string;
  lastRewardedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalVisits?: number;
  totalSavings?: number;
}

export interface PointTransaction {
  id: string;
  loyaltyProfileId: string;
  transactionType: PointTransactionType;
  pointsAmount: number;
  reason: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

export interface LoyaltyRule {
  id: string;
  businessId: string;
  ruleType: RuleType;
  isActive: boolean;
  spendingBaseAmount?: number;
  spendingBasePoints?: number;
  visitPoints?: number;
  visitCooldownHours: number;
  firstVisitBonus: number;
  birthdayBonus: number;
  referralBonus: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  businessId: string;
  name: string;
  description: string;
  rewardType: RewardType;
  pointCost: number;
  value: number;
  valueAmount?: number;
  validityDays: number;
  usageLimitPerUser: number;
  totalAvailable?: number;
  totalRedeemed: number;
  isActive: boolean;
  branchId?: string;
  imageUrls?: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Redemption {
  id: string;
  userId?: string;
  loyaltyProfileId: string;
  rewardId: string;
  reward?: Reward;
  redemptionCode: string;
  pointsSpent: number;
  status: RedemptionStatus;
  branchId?: string;
  redeemedAt: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyPromotion {
  id: string;
  businessId?: string;
  name: string;
  description: string;
  promotionType: 'bonus_points' | 'multiplier' | 'special_reward';
  bonusPoints?: number;
  pointsMultiplier?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PointEarnRequest {
  userId: string;
  branchId: string;
  businessId?: string;
  amountSpent?: number;
  isVisit: boolean;
  metadata?: Record<string, any>;
}

export interface PointEarnResponse {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
  message: string;
  breakdown?: {
    visitPoints?: number;
    spendingPoints?: number;
    bonusPoints?: number;
  };
}

export interface RewardRedeemRequest {
  loyaltyProfileId: string;
  rewardId: string;
  branchId: string;
}

export interface RewardRedeemResponse {
  success: boolean;
  redemption?: Redemption;
  error?: string;
}
