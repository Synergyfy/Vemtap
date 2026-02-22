import { useLoyaltyMockStore } from '@/store/loyaltyMockStore';
import { useBusinessStore } from '@/store/useBusinessStore';
import {
  LoyaltyProfile,
  PointTransaction,
  Reward,
  Redemption,
  LoyaltyRule,
  PointEarnRequest,
  PointEarnResponse,
  RewardRedeemRequest,
  RewardRedeemResponse,
  TierLevel
} from '@/types/loyalty';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Calculate tier level based on total points earned
const calculateTier = (totalEarned: number): TierLevel => {
  if (totalEarned >= 5000) return 'platinum';
  if (totalEarned >= 2000) return 'gold';
  if (totalEarned >= 500) return 'silver';
  return 'bronze';
};

export const loyaltyApi = {
  // Fetch loyalty profile for a user + business
  fetchProfile: async (userId: string, businessId: string): Promise<LoyaltyProfile | null> => {
    await delay(600);
    const state = useLoyaltyMockStore.getState();
    const profile = state.profiles.find(p => p.userId === userId && p.businessId === businessId);
    
    if (!profile) {
      // Create new profile if it doesn't exist
      const newProfile: LoyaltyProfile = {
        id: `lp_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        businessId,
        totalPointsEarned: 0,
        currentPointsBalance: 0,
        pointsRedeemed: 0,
        tierLevel: 'bronze',
        lastVisitDate: new Date().toISOString(),
        lastRewardedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      useLoyaltyMockStore.getState().addProfile(newProfile);
      return newProfile;
    }
    
    return profile;
  },

  // Earn points
  earnPoints: async (request: PointEarnRequest): Promise<PointEarnResponse> => {
    await delay(800);
    const { userId, businessId, amountSpent, isVisit } = request;
    const state = useLoyaltyMockStore.getState();
    const rule = state.rules.find(r => r.businessId === businessId);
    
    if (!rule || !rule.isActive) {
      return { success: false, pointsEarned: 0, newBalance: 0, message: 'Loyalty system is inactive' };
    }

    const profile = await loyaltyApi.fetchProfile(userId, businessId);
    if (!profile) return { success: false, pointsEarned: 0, newBalance: 0, message: 'Profile not found' };

    // Cooldown check for visits
    if (isVisit && profile.lastRewardedAt) {
      const lastRewarded = new Date(profile.lastRewardedAt).getTime();
      const now = Date.now();
      const cooldownMs = rule.visitCooldownHours * 60 * 60 * 1000;
      
      if ((now - lastRewarded) < cooldownMs && !amountSpent) {
        return { 
          success: false, 
          pointsEarned: 0, 
          newBalance: profile.currentPointsBalance, 
          message: `Too soon! Next reward available in ${Math.ceil((cooldownMs - (now - lastRewarded)) / (60 * 60 * 1000))} hours.` 
        };
      }
    }

    // Point Calculation
    let earned = 0;
    const breakdown: any = {};

    if (isVisit) {
      earned += rule.visitPoints || 0;
      breakdown.visitPoints = rule.visitPoints;
    }

    if (amountSpent && rule.spendingBaseAmount && rule.spendingBasePoints) {
      const spendPoints = Math.floor((amountSpent / rule.spendingBaseAmount) * rule.spendingBasePoints);
      earned += spendPoints;
      breakdown.spendingPoints = spendPoints;
    }

    // First visit bonus
    if (profile.totalPointsEarned === 0 && rule.firstVisitBonus) {
      earned += rule.firstVisitBonus;
      breakdown.bonusPoints = (breakdown.bonusPoints || 0) + rule.firstVisitBonus;
    }

    if (earned <= 0) {
      return { success: true, pointsEarned: 0, newBalance: profile.currentPointsBalance, message: 'No points earned for this action' };
    }

    // Update Profile
    const newTotal = profile.totalPointsEarned + earned;
    const newBalance = profile.currentPointsBalance + earned;
    const updates: Partial<LoyaltyProfile> = {
      totalPointsEarned: newTotal,
      currentPointsBalance: newBalance,
      tierLevel: calculateTier(newTotal),
      lastVisitDate: new Date().toISOString(),
      lastRewardedAt: new Date().toISOString()
    };
    useLoyaltyMockStore.getState().updateProfile(profile.id, updates);

    // Record Transaction
    const transaction: PointTransaction = {
      id: `tr_${Math.random().toString(36).substr(2, 9)}`,
      loyaltyProfileId: profile.id,
      transactionType: 'earn',
      pointsAmount: earned,
      reason: isVisit && amountSpent ? 'Visit + Purchase' : isVisit ? 'Visit' : 'Purchase',
      metadata: breakdown,
      createdAt: new Date().toISOString()
    };
    useLoyaltyMockStore.getState().addTransaction(transaction);

    return {
      success: true,
      pointsEarned: earned,
      newBalance,
      message: `Congratulations! You earned ${earned} points.`,
      breakdown
    };
  },

  // Fetch rewards
  fetchRewardsByBusiness: async (businessId: string): Promise<Reward[]> => {
    await delay(500);
    const state = useLoyaltyMockStore.getState();
    const activeBranchId = useBusinessStore.getState().activeBranchId;
    
    return state.rewards.filter(r => 
      r.businessId === businessId && 
      r.isActive && 
      (activeBranchId === 'all' || r.branchId === activeBranchId)
    );
  },

  // Redeem reward
  redeemReward: async (request: RewardRedeemRequest): Promise<RewardRedeemResponse> => {
    await delay(1000);
    const { loyaltyProfileId, rewardId } = request;
    const state = useLoyaltyMockStore.getState();
    const profile = state.profiles.find(p => p.id === loyaltyProfileId);
    const reward = state.rewards.find(r => r.id === rewardId);

    if (!profile || !reward) return { success: false, error: 'Profile or Reward not found' };
    if (profile.currentPointsBalance < reward.pointCost) return { success: false, error: 'Insufficient points' };

    // Update Profile
    const newBalance = profile.currentPointsBalance - reward.pointCost;
    useLoyaltyMockStore.getState().updateProfile(profile.id, {
      currentPointsBalance: newBalance,
      pointsRedeemed: profile.pointsRedeemed + reward.pointCost
    });

    // Create Redemption
    const redemption: Redemption = {
      id: `redem_${Math.random().toString(36).substr(2, 9)}`,
      loyaltyProfileId,
      rewardId,
      redemptionCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
      pointsSpent: reward.pointCost,
      status: 'pending',
      branchId: reward.branchId,
      redeemedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + reward.validityDays * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    useLoyaltyMockStore.getState().addRedemption(redemption);

    // Record Transaction
    const transaction: PointTransaction = {
      id: `tr_${Math.random().toString(36).substr(2, 9)}`,
      loyaltyProfileId,
      transactionType: 'redeem',
      pointsAmount: -reward.pointCost,
      reason: `Redeemed ${reward.name}`,
      referenceId: redemption.id,
      createdAt: new Date().toISOString()
    };
    useLoyaltyMockStore.getState().addTransaction(transaction);

    return { success: true, redemption };
  },

  // Verify redemption (for staff)
  verifyRedemption: async (code: string, businessId: string): Promise<{ success: boolean; redemption?: Redemption; error?: string }> => {
    await delay(700);
    const state = useLoyaltyMockStore.getState();
    const redemption = state.redemptions.find(r => r.redemptionCode === code && r.status === 'pending');
    
    if (!redemption) return { success: false, error: 'Invalid or already used code' };
    
    const reward = state.rewards.find(rew => rew.id === redemption.rewardId);
    if (!reward || reward.businessId !== businessId) return { success: false, error: 'Reward not found for this business' };

    // Check expiry
    if (new Date(redemption.expiresAt) < new Date()) {
      useLoyaltyMockStore.getState().updateRedemption(redemption.id, 'expired');
      return { success: false, error: 'Reward has expired' };
    }

    useLoyaltyMockStore.getState().updateRedemption(redemption.id, 'verified');
    return { success: true, redemption };
  },

  // Fetch transactions
  fetchTransactionsByProfile: async (profileId: string): Promise<PointTransaction[]> => {
    await delay(500);
    const state = useLoyaltyMockStore.getState();
    return state.transactions.filter(t => t.loyaltyProfileId === profileId);
  },

  // Manage Rules
  fetchRules: async (businessId: string): Promise<LoyaltyRule | null> => {
    await delay(400);
    const state = useLoyaltyMockStore.getState();
    return state.rules.find(r => r.businessId === businessId) || null;
  },

  updateRules: async (businessId: string, updates: Partial<LoyaltyRule>): Promise<{ success: boolean }> => {
    await delay(600);
    useLoyaltyMockStore.getState().updateRule(businessId, updates);
    return { success: true };
  },

  // Reward Management (Admin)
  createReward: async (businessId: string, reward: Partial<Reward>): Promise<Reward> => {
    await delay(800);
    const newReward: Reward = {
      id: `rew_${Math.random().toString(36).substr(2, 9)}`,
      businessId,
      name: reward.name || 'New Reward',
      description: reward.description || '',
      pointCost: reward.pointCost || 100,
      rewardType: reward.rewardType || 'discount',
      value: reward.value || 0,
      validityDays: reward.validityDays || 30,
      isActive: true,
      usageLimitPerUser: reward.usageLimitPerUser || 1, 
      totalRedeemed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    useLoyaltyMockStore.getState().addReward(newReward);
    return newReward;
  },

  updateReward: async (businessId: string, rewardId: string, updates: Partial<Reward>): Promise<Reward | null> => {
    await delay(600);
    const state = useLoyaltyMockStore.getState();
    const reward = state.rewards.find(r => r.id === rewardId && r.businessId === businessId);
    if (!reward) return null;

    useLoyaltyMockStore.getState().updateReward(rewardId, updates);
    return { ...reward, ...updates };
  }
};
