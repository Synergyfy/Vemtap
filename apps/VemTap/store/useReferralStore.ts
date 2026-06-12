import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PartnerLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'elite';
export type ReferralStatus = 'invited' | 'registered' | 'activated' | 'subscribed' | 'cancelled';

export interface Referral {
  id: string;
  businessName: string;
  ownerName: string;
  date: string;
  status: ReferralStatus;
  commission: number;
}

export interface Earnings {
  total: number;
  pending: number;
  paid: number;
}

interface ReferralState {
  stats: { referrals: number; active: number; earnings: Earnings };
  referralLink: string;
  referrals: Referral[];
  partnerLevel: PartnerLevel;
  
  // Actions
  generateLink: () => void;
  requestPayout: (amount: number) => void;
  updateStats: (stats: Partial<ReferralState['stats']>) => void;
  resetStore: () => void;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set) => ({
      stats: { referrals: 42, active: 31, earnings: { total: 385000, pending: 42500, paid: 342500 } },
      referralLink: 'vemtap.com/ref/ABC123',
      referrals: [],
      partnerLevel: 'gold',

      generateLink: () => set({ referralLink: `vemtap.com/ref/${Math.random().toString(36).substr(2, 6).toUpperCase()}` }),
      
      requestPayout: (amount) => {
        // Logic for payout request
        console.log(`Payout requested: ${amount}`);
      },
      
      updateStats: (updates) => set((state) => ({
        stats: { ...state.stats, ...updates }
      })),

      resetStore: () => set({
        stats: { referrals: 0, active: 0, earnings: { total: 0, pending: 0, paid: 0 } },
        referralLink: '',
        referrals: [],
        partnerLevel: 'bronze',
      }),
    }),
    {
      name: 'vemtap-referral-storage',
    }
  )
);
