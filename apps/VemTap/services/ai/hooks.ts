import { useQuery, useMutation } from '@tanstack/react-query';
import { useAIStore } from '@/store/useAIStore';
import { api } from '@/lib/api';
import type { AIAnalysisResponse, AIAnalysisRequest } from './types';
import { AI_CREDIT_COST } from './types';

export function useAIAnalysis(page: string) {
  const refreshKey = useAIStore((state) => state.refreshKeys[page] ?? 0);

  return useQuery<AIAnalysisResponse, Error>({
    queryKey: ['ai-analysis', page, refreshKey],
    queryFn: async () => {
      const store = useAIStore.getState();
      const context = store.analysisContext[page] ?? {};
      
      const response: AIAnalysisResponse = await api.post('/ai/analyze', {
        page,
        context,
      });

      store.setLastUpdated(page, response.generatedAt || new Date().toISOString());
      store.consumeCredits(response.creditsUsed || 1);
      return response;
    },
    enabled: refreshKey > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useTriggerAnalysis() {
  return useMutation<void, Error, AIAnalysisRequest>({
    mutationFn: async (request) => {
      const store = useAIStore.getState();
      const cost = AI_CREDIT_COST.quickAnalysis;

      if (store.credits.available < cost) {
        throw new Error('Insufficient AI credits. Please upgrade your plan to continue.');
      }

      store.triggerAnalysis(request.page);
    },
  });
}

export function useDeepAnalysis() {
  return useMutation<void, Error, AIAnalysisRequest>({
    mutationFn: async (request) => {
      const store = useAIStore.getState();
      const cost = AI_CREDIT_COST.deepAnalysis;

      if (store.credits.available < cost) {
        throw new Error('Insufficient AI credits for deep analysis.');
      }

      store.triggerAnalysis(request.page);
    },
  });
}
