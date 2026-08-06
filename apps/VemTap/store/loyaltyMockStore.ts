import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LoyaltyProfile,
  PointTransaction,
  LoyaltyRule,
  Reward,
  Redemption,
  LoyaltyPromotion,
  TierLevel,
  RedemptionStatus
} from '@/types/loyalty';

interface LoyaltyMockState {
  profiles: LoyaltyProfile[];
  transactions: PointTransaction[];
  rules: LoyaltyRule[];
  rewards: Reward[];
  redemptions: Redemption[];
  promotions: LoyaltyPromotion[];
  fraudLogs: any[];

  // Actions
  addProfile: (profile: LoyaltyProfile) => void;
  updateProfile: (id: string, updates: Partial<LoyaltyProfile>) => void;
  addTransaction: (transaction: PointTransaction) => void;
  updateRule: (businessId: string, updates: Partial<LoyaltyRule>) => void;
  addReward: (reward: Reward) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  addRedemption: (redemption: Redemption) => void;
  updateRedemption: (id: string, status: RedemptionStatus, verifiedBy?: string) => void;
  addPromotion: (promotion: LoyaltyPromotion) => void;
  reset: () => void;
}



export const useLoyaltyMockStore = create<LoyaltyMockState>()(
  persist(
    (set) => ({
      profiles: [],
      transactions: [],
      rules: [],
      rewards: [],
      redemptions: [],
      promotions: [],
      fraudLogs: [],

      addProfile: (profile) => set((state) => ({ 
        profiles: [...state.profiles, profile] 
      })),

      updateProfile: (id, updates) => set((state) => ({
        profiles: state.profiles.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
      })),

      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
      })),

      updateRule: (businessId, updates) => set((state) => ({
        rules: state.rules.map(r => r.businessId === businessId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
      })),

      addReward: (reward) => set((state) => ({
        rewards: [reward, ...state.rewards]
      })),

      updateReward: (id, updates) => set((state) => ({
        rewards: state.rewards.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
      })),

      addRedemption: (redemption) => set((state) => ({
        redemptions: [redemption, ...state.redemptions]
      })),

      updateRedemption: (id, status, verifiedBy) => set((state) => ({
        redemptions: state.redemptions.map(r => 
          r.id === id ? { 
            ...r, 
            status, 
            verifiedAt: status === 'verified' ? new Date().toISOString() : r.verifiedAt,
            verifiedByUserId: verifiedBy || r.verifiedByUserId,
            updatedAt: new Date().toISOString() 
          } : r
        )
      })),

      addPromotion: (promotion) => set((state) => ({
        promotions: [promotion, ...state.promotions]
      })),

      reset: () => set({
        profiles: [],
        transactions: [],
        rules: [],
        rewards: [],
        redemptions: [],
        promotions: [],
        fraudLogs: []
      })
    }),
    {
      name: 'loyalty-mock-storage',
    }
  )
);
