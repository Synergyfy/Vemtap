import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DateRange = 'today' | '7d' | '30d' | '90d' | '12m' | 'custom';
export type AnalyticsTab = 'overview' | 'customers' | 'messaging' | 'qr' | 'revenue' | 'reports';

interface AnalyticsState {
  dateRange: DateRange;
  activeTab: AnalyticsTab;
  filters: Record<string, any>;
  
  // Actions
  setDateRange: (range: DateRange) => void;
  setActiveTab: (tab: AnalyticsTab) => void;
  setFilters: (filters: Record<string, any>) => void;
  resetStore: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      dateRange: '30d',
      activeTab: 'overview',
      filters: {},

      setDateRange: (dateRange) => set({ dateRange }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

      resetStore: () => set({
        dateRange: '30d',
        activeTab: 'overview',
        filters: {},
      }),
    }),
    {
      name: 'vemtap-analytics-storage',
    }
  )
);
