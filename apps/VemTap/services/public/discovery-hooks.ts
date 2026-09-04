import { useQuery } from '@tanstack/react-query';
import { api, publicApi } from '@/lib/api';
import type {
    PublicBusiness,
    PublicBusinessesResponse,
    PublicSearchResponse,
    PublicStatsResponse,
} from '../deals/types';

export const usePublicBusinesses = (params: { sortBy?: string; limit?: number } = {}) =>
    useQuery<{ businesses: PublicBusiness[] }>({
        queryKey: ['public', 'businesses', params],
        queryFn: () => publicApi.get('/public/businesses', params),
    });

export const usePublicSearch = (q: string, limit = 8) =>
    useQuery<PublicSearchResponse>({
        queryKey: ['public', 'search', q],
        queryFn: () => api.get('/public/search', { params: { q, limit } }),
        enabled: !!q && q.length >= 2,
    });

export const usePublicStats = () =>
    useQuery<PublicStatsResponse>({
        queryKey: ['public', 'stats'],
        queryFn: () => api.get('/public/stats'),
        staleTime: 5 * 60_000,
    });
