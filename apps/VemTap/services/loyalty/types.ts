import type { 
    PointTransactionType, 
    RewardType, 
    RedemptionStatus, 
    TierLevel, 
    RuleType, 
    ExpiryType,
    LoyaltyProfile, 
    PointTransaction, 
    LoyaltyRule, 
    Reward, 
    Redemption, 
    PointEarnRequest, 
    PointEarnResponse, 
    RewardRedeemRequest, 
    RewardRedeemResponse 
} from '@/types/loyalty';

export type { 
    PointTransactionType, 
    RewardType, 
    RedemptionStatus, 
    TierLevel, 
    RuleType, 
    ExpiryType,
    LoyaltyProfile, 
    PointTransaction, 
    LoyaltyRule, 
    Reward, 
    Redemption, 
    PointEarnRequest, 
    PointEarnResponse, 
    RewardRedeemRequest, 
    RewardRedeemResponse 
};

export type TemplateStatus = 'draft' | 'published';

export interface TemplateReward {
    id: string;
    name: string;
    description: string;
    rewardType: RewardType;
    pointCost: number;
    value: number;
    validityDays: number;
    usageLimitPerUser: number;
    totalAvailable?: number;
    isActive?: boolean;
    imageUrls?: string[];
    imageUrl?: string;
}

export interface LoyaltyTemplate {
    id: string;
    name: string;
    description?: string;
    pointsRequired: number;
    category: RewardType;
    coverImage?: string;
    galleryImages?: string[];
    status?: TemplateStatus;
    rewards?: TemplateReward[];
    rules?: Partial<LoyaltyRule>;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
    createdById?: string;
}

export interface VerifyRedemptionResponse {
    success: boolean;
    redemption?: {
        id: string;
        status: string;
        verifiedAt: string;
        pointsSpent: number;
        redemptionCode: string;
        reward: Reward;
        loyaltyProfile: LoyaltyProfile & {
            user?: {
                firstName: string;
                lastName: string;
            }
        };
    };
    error?: string;
}

export interface CreateRewardRequest {
    name: string;
    description: string;
    rewardType: RewardType;
    pointCost: number;
    value: number;
    validityDays: number;
    usageLimitPerUser: number;
    totalAvailable?: number;
    audienceTarget?: 'all' | 'new' | 'returning';
    branchId?: string;
    imageUrls?: string[];
}

export interface UpdateRewardRequest {
    name?: string;
    description?: string;
    pointCost?: number;
    value?: number;
    validityDays?: number;
    usageLimitPerUser?: number;
    totalAvailable?: number;
    isActive?: boolean;
    audienceTarget?: 'all' | 'new' | 'returning';
    branchId?: string;
    imageUrls?: string[];
}

export interface UpdateLoyaltyRuleRequest {
    visitPoints?: number;
    spendingBaseAmount?: number;
    spendingBasePoints?: number;
    visitCooldownHours?: number;
    firstVisitBonus?: number;
    birthdayBonus?: number;
    referralBonus?: number;
    isActive?: boolean;
}

export interface BusinessLoyaltyStats {
    stats: { label: string; value: string; change: number; trend: 'up' | 'down' }[];
    tierDistribution: { label: string; value: number; color: string }[];
    activityTrend: { name: string; earnings: number; claims: number }[];
    growthForecast: string;
}

export interface CustomerAnalytics {
    totalVisits: number;
    currentPointsBalance: number;
    netSavings: number;
    visitTrends: { month: string; visits: number }[];
    pointsByVenue: { venueName: string; points: number }[];
    topVenues: { venueName: string; points: number; visits: number }[];
}

export interface ClaimCodeResponse {
    success: boolean;
    redemption: Redemption;
}

export interface ApplyTemplateResponse {
    success: boolean;
    message: string;
}
