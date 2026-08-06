import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIAnalysisResponse, AICredits } from '@/services/ai/types';

export type AnalysisContext = Record<string, unknown>;

interface AIState {
  credits: AICredits;
  refreshKeys: Record<string, number>;
  lastUpdated: Record<string, string>;
  activeAnalysis: Record<string, AIAnalysisResponse>;
  analysisContext: Record<string, AnalysisContext>;

  triggerAnalysis: (page: string, context?: AnalysisContext) => void;
  setCredits: (credits: AICredits) => void;
  setLastUpdated: (page: string, timestamp: string) => void;
  cacheAnalysis: (page: string, analysis: AIAnalysisResponse) => void;
  clearAnalysis: (page: string) => void;
  resetCredits: () => void;
  isCopilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      credits: {
        available: 0,
        used: 0,
        limit: 0,
        enabled: false,
      },
      refreshKeys: {},
      lastUpdated: {},
      activeAnalysis: {},
      analysisContext: {},
      isCopilotOpen: false,

      triggerAnalysis: (page, context) =>
        set((state) => ({
          refreshKeys: {
            ...state.refreshKeys,
            [page]: (state.refreshKeys[page] ?? 0) + 1,
          },
          ...(context ? {
            analysisContext: {
              ...state.analysisContext,
              [page]: context,
            },
          } : {}),
        })),

      setCredits: (credits) =>
        set({ credits }),

      setLastUpdated: (page, timestamp) =>
        set((state) => ({
          lastUpdated: {
            ...state.lastUpdated,
            [page]: timestamp,
          },
        })),

      cacheAnalysis: (page, analysis) =>
        set((state) => ({
          activeAnalysis: {
            ...state.activeAnalysis,
            [page]: analysis,
          },
        })),

      clearAnalysis: (page) =>
        set((state) => {
          const { [page]: _, ...rest } = state.activeAnalysis;
          const { [page]: __, ...restKeys } = state.refreshKeys;
          const { [page]: ___, ...restUpdated } = state.lastUpdated;
          return {
            activeAnalysis: rest,
            refreshKeys: restKeys,
            lastUpdated: restUpdated,
          };
        }),

      resetCredits: () =>
        set({
          credits: {
            available: 0,
            used: 0,
            limit: 0,
            enabled: false,
          },
        }),

      setCopilotOpen: (open) => set({ isCopilotOpen: open }),

      toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
    }),
    {
      name: 'vemtap-ai-storage',
      partialize: (state) => {
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        
        // Filter out activeAnalysis older than 24 hours
        const activeAnalysis = Object.entries(state.activeAnalysis).reduce((acc, [page, data]) => {
          const updatedTimestamp = state.lastUpdated[page];
          if (updatedTimestamp && (now - Number(updatedTimestamp)) < ONE_DAY) {
            acc[page] = data;
          }
          return acc;
        }, {} as Record<string, any>);
        
        // Also clean up lastUpdated keys
        const lastUpdated = Object.entries(state.lastUpdated).reduce((acc, [page, timestamp]) => {
          if ((now - Number(timestamp)) < ONE_DAY) {
            acc[page] = timestamp;
          }
          return acc;
        }, {} as Record<string, string>);

        return {
          credits: state.credits,
          lastUpdated,
          activeAnalysis,
        };
      },
    }
  )
);
