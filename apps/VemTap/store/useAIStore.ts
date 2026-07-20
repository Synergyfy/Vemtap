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
  consumeCredits: (amount: number) => void;
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
        available: 100,
        used: 0,
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

      consumeCredits: (amount) =>
        set((state) => ({
          credits: {
            available: Math.max(0, state.credits.available - amount),
            used: state.credits.used + amount,
          },
        })),

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
            available: 100,
            used: 0,
          },
        }),

      setCopilotOpen: (open) => set({ isCopilotOpen: open }),

      toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
    }),
    {
      name: 'vemtap-ai-storage',
      partialize: (state) => ({
        credits: state.credits,
        lastUpdated: state.lastUpdated,
        activeAnalysis: state.activeAnalysis,
      }),
    }
  )
);
