import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAIStore } from '@/store/useAIStore';
import { api } from '@/lib/api';
import type { AIAnalysisResponse, AICredits } from './types';

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
