import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAIStore } from '@/store/useAIStore';
import { api } from '@/lib/api';
import type { AIAnalysisResponse, AIAnalysisRequest, AICredits } from './types';

export function useAICredits() {
  const setCredits = useAIStore((state) => state.setCredits);

  return useQuery<AICredits, Error>({
    queryKey: ['ai-credits'],
    queryFn: async () => {
      const response: AICredits = await api.get('/ai/credits');
      setCredits(response);
      return response;
    },
    staleTime: 60 * 1000,
  });
}

export function useAIAnalysis(page: string) {
  const refreshKey = useAIStore((state) => state.refreshKeys[page] ?? 0);
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
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
      const { enabled, available, limit } = store.credits;

      if (!enabled) {
        throw new Error('AI Copilot is not enabled on your current plan. Please upgrade to use this feature.');
      }

      if (limit !== -1 && available <= 0) {
        throw new Error('You have used all available AI credits for this billing period.');
      }

      store.triggerAnalysis(request.page);
    },
  });
}

export function useDeepAnalysis() {
  return useMutation<void, Error, AIAnalysisRequest>({
    mutationFn: async (request) => {
      const store = useAIStore.getState();
      const { enabled, available, limit } = store.credits;

      if (!enabled) {
        throw new Error('AI Copilot is not enabled on your current plan.');
      }

      if (limit !== -1 && available <= 0) {
        throw new Error('Insufficient AI credits for deep analysis.');
      }

      store.triggerAnalysis(request.page);
    },
  });
}
