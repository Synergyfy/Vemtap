import { api } from '@/lib/api';
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
} from '@/types/loyalty';

export const loyaltyApi = {
  // Fetch loyalty profile for a user + branch
  fetchProfile: async (userId: string, branchId: string): Promise<LoyaltyProfile | null> => {
    return api.get(`/loyalty/profile/${userId}?branchId=${branchId}`);
  },

  // Earn points
  earnPoints: async (request: PointEarnRequest): Promise<PointEarnResponse> => {
    const { branchId, ...data } = request;
    return api.post(`/loyalty/earn?branchId=${branchId}`, data);
  },

  // Fetch all profiles for a branch (for admin/staff)
  fetchAllProfiles: async (branchId: string): Promise<LoyaltyProfile[]> => {
    return api.get(`/loyalty/profiles?branchId=${branchId}`);
  },

  // Fetch rewards for a branch
  fetchRewardsByBusiness: async (branchId: string): Promise<Reward[]> => {
    return api.get(`/loyalty/rewards?branchId=${branchId}`);
  },

  // Redeem reward
  redeemReward: async (request: RewardRedeemRequest): Promise<RewardRedeemResponse> => {
    const { branchId, ...data } = request;
    return api.post(`/loyalty/redeem?branchId=${branchId}`, data);
  },

  // Verify redemption (for staff)
  verifyRedemption: async (code: string, branchId: string): Promise<{ success: boolean; redemption?: Redemption; error?: string }> => {
    return api.post(`/loyalty/verify-redemption?branchId=${branchId}`, { code });
  },

  // Fetch transactions
  fetchTransactionsByProfile: async (profileId: string): Promise<PointTransaction[]> => {
    return api.get(`/loyalty/transactions/${profileId}`);
  },

  // Manage Rules
  fetchRules: async (branchId: string): Promise<LoyaltyRule | null> => {
    return api.get(`/loyalty/rules?branchId=${branchId}`);
  },

  updateRules: async (branchId: string, updates: Partial<LoyaltyRule>): Promise<{ success: boolean }> => {
    return api.patch(`/loyalty/rules?branchId=${branchId}`, updates);
  },

  // Reward Management (Admin)
  createReward: async (branchId: string, reward: Partial<Reward>): Promise<Reward> => {
    return api.post(`/loyalty/rewards?branchId=${branchId}`, reward);
  },

  updateReward: async (branchId: string, rewardId: string, updates: Partial<Reward>): Promise<Reward | null> => {
    return api.patch(`/loyalty/rewards/${rewardId}?branchId=${branchId}`, updates);
  },

  // Fetch customer overall analytics (visits, points, savings)
  fetchCustomerAnalytics: async (): Promise<{
    totalVisits: number;
    currentPointsBalance: number;
    netSavings: number;
    visitTrends: { month: string; visits: number }[];
    pointsByVenue: { venueName: string; points: number }[];
    topVenues: { venueName: string; points: number }[];
  }> => {
    return api.get('/loyalty/analytics');
  }
};
