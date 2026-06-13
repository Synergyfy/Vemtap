import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerHealth {
  id: string;
  score: number;
  status: 'healthy' | 'at_risk' | 'inactive';
}

export interface Insight {
  id: string;
  type: 'growth' | 'retention' | 'revenue';
  title: string;
  message: string;
}

interface IntelligenceState {
  healthScores: Record<string, CustomerHealth>;
  actionableInsights: Insight[];
  
  // Actions
  fetchCustomerIntelligence: (customerId: string) => void;
  calculateHealthScore: (customerId: string) => void;
  resetStore: () => void;
}

export const useIntelligenceStore = create<IntelligenceState>()(
  persist(
    (set) => ({
      healthScores: {},
      actionableInsights: [],

      fetchCustomerIntelligence: (customerId) => {
        // Logic to fetch data from API
      },
      
      calculateHealthScore: (customerId) => {
        // Logic to calculate score based on visits/orders
      },

      resetStore: () => set({
        healthScores: {},
        actionableInsights: [],
      }),
    }),
    {
      name: 'vemtap-intelligence-storage',
    }
  )
);
