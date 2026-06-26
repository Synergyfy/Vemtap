import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  totalPoints: number;
}

interface PosLoyaltyState {
  customers: LoyaltyCustomer[];
  lastEarnedPoints: number;
  lastEarnedCustomerId: string | null;
  lastRedeemedPoints: number;
  redemptionThreshold: number;

  addOrGetCustomer: (name: string, phone: string) => LoyaltyCustomer;
  addPoints: (customerId: string, points: number) => void;
  deductPoints: (customerId: string, points: number) => boolean;
  getPointsBalance: (customerId: string) => number;
  setLastEarned: (customerId: string, points: number) => void;
  setRedemptionThreshold: (threshold: number) => void;
  clearLastEarned: () => void;
}

export const usePosLoyaltyStore = create<PosLoyaltyState>()(
  persist(
    (set, get) => ({
      customers: [],
      lastEarnedPoints: 0,
      lastEarnedCustomerId: null,
      lastRedeemedPoints: 0,
      redemptionThreshold: 100,

      addOrGetCustomer: (name, phone) => {
        const existing = get().customers.find(c => c.phone === phone);
        if (existing) return existing;

        const newCustomer: LoyaltyCustomer = {
          id: `loyal-c-${Date.now()}`,
          name,
          phone,
          totalPoints: 0,
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        return newCustomer;
      },

      addPoints: (customerId, points) => {
        if (points <= 0) return;
        set((state) => ({
          customers: state.customers.map(c =>
            c.id === customerId ? { ...c, totalPoints: c.totalPoints + points } : c
          ),
        }));
      },

      deductPoints: (customerId, points) => {
        const customer = get().customers.find(c => c.id === customerId);
        if (!customer || customer.totalPoints < points) return false;
        set((state) => ({
          customers: state.customers.map(c =>
            c.id === customerId ? { ...c, totalPoints: c.totalPoints - points } : c
          ),
          lastRedeemedPoints: points,
        }));
        return true;
      },

      getPointsBalance: (customerId) => {
        const customer = get().customers.find(c => c.id === customerId);
        return customer?.totalPoints ?? 0;
      },

      setLastEarned: (customerId, points) => {
        set({ lastEarnedCustomerId: customerId, lastEarnedPoints: points });
      },

      setRedemptionThreshold: (threshold) => {
        set({ redemptionThreshold: Math.max(1, threshold) });
      },

      clearLastEarned: () => {
        set({ lastEarnedPoints: 0, lastEarnedCustomerId: null });
      },
    }),
    { name: 'vemtap-pos-loyalty-storage' }
  )
);
