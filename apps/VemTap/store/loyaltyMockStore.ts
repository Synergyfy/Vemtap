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

// Initial Mock Data
const INITIAL_RULES: LoyaltyRule[] = [
  {
    id: 'lr_bistro_001',
    businessId: 'bistro_001',
    ruleType: 'hybrid',
    isActive: true,
    spendingBaseAmount: 1000,
    spendingBasePoints: 10,
    visitPoints: 5,
    visitCooldownHours: 24,
    firstVisitBonus: 20,
    birthdayBonus: 30,
    referralBonus: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_REWARDS: Reward[] = [
  {
    id: 'rew_001',
    businessId: 'bistro_001',
    branchId: 'head-office',
    name: 'Free Coffee',
    description: 'Enjoy a free brewed coffee on us!',
    rewardType: 'free_item',
    pointCost: 100,
    value: 0,
    validityDays: 30,
    usageLimitPerUser: 1,
    totalAvailable: 100,
    totalRedeemed: 15,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=400&h=400&fit=crop',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rew_002',
    businessId: 'bistro_001',
    branchId: 'ikeja-branch',
    name: '₦1,000 Discount',
    description: 'Get ₦1,000 off your next meal.',
    rewardType: 'discount',
    pointCost: 500,
    value: 1000,
    valueAmount: 1000,
    validityDays: 14,
    usageLimitPerUser: 1,
    totalRedeemed: 5,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rew_003',
    businessId: 'bistro_001',
    branchId: 'abuja-branch',
    name: 'VIP Lunch Pack',
    description: 'Exclusive Abuja VIP lunch pack.',
    rewardType: 'gift',
    pointCost: 1000,
    value: 5000,
    valueAmount: 5000,
    validityDays: 7,
    usageLimitPerUser: 1,
    totalRedeemed: 2,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=400&h=400&fit=crop',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const useLoyaltyMockStore = create<LoyaltyMockState>()(
  persist(
    (set) => ({
      profiles: [],
      transactions: [],
      rules: INITIAL_RULES,
      rewards: INITIAL_REWARDS,
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
        rules: INITIAL_RULES,
        rewards: INITIAL_REWARDS,
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
