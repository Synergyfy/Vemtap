import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { LegalAgreement, LegalAgreementAcceptance, PaginatedAgreementHistory } from './types';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const useLegalAgreements = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery<LegalAgreement[], Error>({
    queryKey: ['legal-agreements'],
    queryFn: async () => {
      return await api.get('/legal-agreements');
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIME,
  });
};

export const useLegalAgreement = (slug: string) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery<LegalAgreement, Error>({
    queryKey: ['legal-agreements', slug],
    queryFn: async () => {
      return await api.get(`/legal-agreements/${slug}`);
    },
    enabled: isAuthenticated && Boolean(slug),
    staleTime: STALE_TIME,
  });
};

export const useAgreementHistory = (slug: string, page = 1, limit = 10) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery<PaginatedAgreementHistory, Error>({
    queryKey: ['legal-agreements', slug, 'history', page, limit],
    queryFn: async () => {
      return await api.get(`/legal-agreements/${slug}/history?page=${page}&limit=${limit}`);
    },
    enabled: isAuthenticated && Boolean(slug),
    staleTime: STALE_TIME,
  });
};

export const useAcceptAgreement = () => {
  const queryClient = useQueryClient();
  return useMutation<LegalAgreementAcceptance, Error, { slug: string; signatureHash?: string }>({
    mutationFn: async ({ slug, signatureHash }) => {
      return await api.post(`/legal-agreements/${slug}/accept`, { signatureHash });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['legal-agreements'] });
      queryClient.invalidateQueries({ queryKey: ['legal-agreements', variables.slug] });
    },
  });
};
