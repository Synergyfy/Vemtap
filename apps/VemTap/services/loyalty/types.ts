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
    rewardType: 'discount' | 'free_item' | 'service' | 'cashback' | 'gift';
    pointCost: number;
    value: number;
    validityDays: number;
    usageLimitPerUser: number;
    totalAvailable?: number;
    branchId?: string;
    imageUrl?: string;
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
    branchId?: string;
    imageUrl?: string;
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
