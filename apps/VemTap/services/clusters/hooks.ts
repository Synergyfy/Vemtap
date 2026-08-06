import { useQuery } from '@tanstack/react-query';
import { clustersPublicApi } from '@/lib/api/clusters';
import type { ClusterContextResponse, ClusterDealsResponse, ClusterDealsQuery } from '@/lib/api/clusters';

export const useClusterContext = (uniqueCode: string) =>
    useQuery<ClusterContextResponse>({
        queryKey: ['cluster', 'context', uniqueCode],
        queryFn: () => clustersPublicApi.getContext(uniqueCode),
        enabled: !!uniqueCode,
        staleTime: 5 * 60_000,
        retry: false,
    });

export const useClusterDeals = (uniqueCode: string, params: ClusterDealsQuery, enabled = true) =>
    useQuery<ClusterDealsResponse>({
        queryKey: ['cluster', 'deals', uniqueCode, params],
        queryFn: () => clustersPublicApi.getDeals(uniqueCode, params),
        enabled: !!uniqueCode && enabled,
        staleTime: 5 * 60_000,
        retry: false,
    });