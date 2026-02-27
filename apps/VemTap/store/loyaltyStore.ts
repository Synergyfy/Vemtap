import { create } from 'zustand';
import { loyaltyApi } from '@/lib/api/loyalty';
import {
  LoyaltyProfile,
  PointTransaction,
  Reward,
  Redemption,
  PointEarnRequest,
  LoyaltyRule
} from '@/types/loyalty';

interface LoyaltyState {
  // Current user's loyalty profiles (one per business)
  profiles: Record<string, LoyaltyProfile>; // key: businessId

  // Recent transactions for current viewed business
  recentTransactions: PointTransaction[];

  // Available rewards for current business
  availableRewards: Reward[];

  // User's redemptions
  redemptions: Redemption[];

  // Last earned points info for modal
  lastEarnedResponse: {
    pointsEarned: number;
    newBalance: number;
    message: string;
    breakdown?: any;
  } | null;

  // Overall customer analytics
  analytics: {
    totalVisits: number;
    currentPointsBalance: number;
    netSavings: number;
    visitTrends: { month: string; visits: number }[];
    pointsByVenue: { venueName: string; points: number }[];
    topVenues: { venueName: string; points: number }[];
  } | null;

  // Loading & Error states
  isLoading: boolean;
  error: string | null;

  // Admin State
  rules: LoyaltyRule | null;
  allProfiles: LoyaltyProfile[];

  // Actions
  fetchLoyaltyProfile: (userId: string, branchId: string) => Promise<LoyaltyProfile | null>;
  fetchAllProfiles: (branchId: string) => Promise<void>;
  fetchRewards: (branchId: string) => Promise<void>;
  fetchTransactions: (profileId: string) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  earnPoints: (request: PointEarnRequest) => Promise<{ success: boolean; pointsEarned: number; message: string; newBalance?: number; breakdown?: any }>;
  redeemReward: (loyaltyProfileId: string, rewardId: string) => Promise<{ success: boolean; redemption?: Redemption; error?: string }>;
  setLastEarnedResponse: (response: LoyaltyState['lastEarnedResponse']) => void;
  clearLoyaltyData: () => void;

  // Admin Actions
  fetchRules: (branchId: string) => Promise<void>;
  updateRules: (branchId: string, updates: Partial<LoyaltyRule>) => Promise<void>;
  createReward: (branchId: string, reward: Partial<Reward>) => Promise<void>;
  updateReward: (branchId: string, id: string, updates: Partial<Reward>) => Promise<void>;
  verifyRedemption: (branchId: string, code: string) => Promise<{ success: boolean; redemption?: Redemption; reward?: Reward; error?: string }>;
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  profiles: {},
  recentTransactions: [],
  availableRewards: [],
  redemptions: [],
  lastEarnedResponse: null,
  analytics: null,
  isLoading: false,
  error: null,
  rules: null,
  allProfiles: [],

  fetchLoyaltyProfile: async (userId: string, branchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await loyaltyApi.fetchProfile(userId, branchId);
      if (profile) {
        set(state => ({
          profiles: { ...state.profiles, [branchId]: profile },
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
      return profile;
    } catch (error) {
      console.error('Failed to fetch loyalty profile:', error);
      set({ isLoading: false, error: 'Failed to load loyalty profile' });
      return null;
    }
  },

  fetchAllProfiles: async (branchId: string) => {
    set({ isLoading: true });
    try {
      const profiles = await loyaltyApi.fetchAllProfiles(branchId);
      set({ allProfiles: profiles, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch customer directory' });
    }
  },

  fetchRewards: async (branchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rewards = await loyaltyApi.fetchRewardsByBusiness(branchId);
      set({ availableRewards: rewards, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      set({ isLoading: false, error: 'Failed to load rewards' });
    }
  },

  fetchTransactions: async (profileId: string) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await loyaltyApi.fetchTransactionsByProfile(profileId);
      set({ recentTransactions: transactions, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      set({ isLoading: false, error: 'Failed to load transactions' });
    }
  },

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const analytics = await loyaltyApi.fetchCustomerAnalytics();
      set({ analytics, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      set({ isLoading: false, error: 'Failed to load analytics' });
    }
  },

  earnPoints: async (request: PointEarnRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loyaltyApi.earnPoints(request);
      if (response.success) {
        // Refresh profile to get updated balance
        await get().fetchLoyaltyProfile(request.userId, request.branchId);

        // Store for UI modal
        set({
          lastEarnedResponse: {
            pointsEarned: response.pointsEarned,
            newBalance: response.newBalance || 0,
            message: response.message,
            breakdown: response.breakdown
          }
        });
      }
      set({ isLoading: false });
      return response;
    } catch (error) {
      console.error('Failed to earn points:', error);
      set({ isLoading: false, error: 'Failed to process points' });
      return { success: false, pointsEarned: 0, message: 'Server error occurred', newBalance: 0 };
    }
  },

  redeemReward: async (loyaltyProfileId: string, rewardId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Find the profile and the branchId key it's stored under
      const profilesMap = get().profiles;
      const branchId = Object.keys(profilesMap).find(k => profilesMap[k].id === loyaltyProfileId);
      const profile = branchId ? profilesMap[branchId] : undefined;

      if (!profile || !branchId) return { success: false, error: 'Profile not found' };

      const response = await loyaltyApi.redeemReward({
        loyaltyProfileId,
        rewardId,
        branchId // Correctly using the branchId key from profiles map
      });

      if (response.success && response.redemption) {
        // Refresh profile balance and transaction history
        await get().fetchLoyaltyProfile(profile.userId, branchId);
        await get().fetchTransactions(loyaltyProfileId);
      }
      set({ isLoading: false });
      return response;
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      set({ isLoading: false, error: 'Failed to redeem reward' });
      return { success: false, error: 'Server error occurred' };
    }
  },

  setLastEarnedResponse: (response) => set({ lastEarnedResponse: response }),

  fetchRules: async (branchId: string) => {
    set({ isLoading: true });
    try {
      const rules = await loyaltyApi.fetchRules(branchId);
      set({ rules, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch rules' });
    }
  },

  updateRules: async (branchId: string, updates: Partial<LoyaltyRule>) => {
    set({ isLoading: true });
    try {
      await loyaltyApi.updateRules(branchId, updates);
      await get().fetchRules(branchId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to update rules' });
    }
  },

  createReward: async (branchId: string, reward: Partial<Reward>) => {
    set({ isLoading: true });
    try {
      await loyaltyApi.createReward(branchId, reward);
      await get().fetchRewards(branchId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create reward' });
    }
  },

  updateReward: async (branchId: string, id: string, updates: Partial<Reward>) => {
    set({ isLoading: true });
    try {
      await loyaltyApi.updateReward(branchId, id, updates);
      await get().fetchRewards(branchId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to update reward' });
    }
  },

  verifyRedemption: async (branchId: string, code: string) => {
    set({ isLoading: true });
    try {
      const result = await loyaltyApi.verifyRedemption(code, branchId);
      set({ isLoading: false });

      if (result.success && result.redemption) {
        const reward = (get().availableRewards.length > 0)
          ? get().availableRewards.find(r => r.id === result.redemption?.rewardId)
          : undefined;

        return { ...result, reward };
      }

      return result;
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: 'Verification failed' };
    }
  },

  clearLoyaltyData: () => {
    set({
      profiles: {},
      recentTransactions: [],
      availableRewards: [],
      redemptions: [],
      rules: null,
      error: null
    });
  }
}));
