// =============================================================================
// SMART DEAL ROTATOR — REACT QUERY HOOKS
// =============================================================================

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rotatorApi } from './api';
import type {
    RotationConfig,
    RotationAnalytics,
    RotatorDeal,
    RotationPreview,
    GlobalRotationDefaults,
} from './types';

export const useClusterRotation = (clusterId: string | null | undefined) =>
    useQuery<RotationConfig>({
        queryKey: ['rotator', 'config', clusterId],
        queryFn: () => rotatorApi.getConfig(clusterId!),
        enabled: !!clusterId,
        staleTime: 30_000,
        retry: false,
    });

export const useGlobalRotationDefaults = () =>
    useQuery<GlobalRotationDefaults>({
        queryKey: ['rotator', 'defaults'],
        queryFn: () => rotatorApi.getGlobalDefaults(),
        staleTime: 60_000,
        retry: false,
    });

export const useRotatorDeals = (clusterId: string | null | undefined) =>
    useQuery<RotatorDeal[]>({
        queryKey: ['rotator', 'deals', clusterId],
        queryFn: () => rotatorApi.getEligibleDeals(clusterId!),
        enabled: !!clusterId,
        staleTime: 60_000,
        retry: false,
    });

export const useRotatorAnalytics = (cluster: {
    id: string;
    name: string;
    totalScans: number;
} | null | undefined) =>
    useQuery<RotationAnalytics>({
        queryKey: ['rotator', 'analytics', cluster?.id],
        queryFn: () => rotatorApi.getAnalytics(cluster!.id, cluster!.name, cluster!.totalScans),
        enabled: !!cluster,
        staleTime: 60_000,
        retry: false,
    });

export const useRotatorPreview = (
    clusterId: string | null | undefined,
    seed: number,
) =>
    useQuery<RotationPreview>({
        queryKey: ['rotator', 'preview', clusterId, seed],
        queryFn: () => rotatorApi.getPreview(clusterId!, { seed }),
        enabled: !!clusterId,
        staleTime: 0,
        retry: false,
    });

/**
 * Runs a rotator mutation, pushes the freshly returned config into the cache
 * (instant UI) and revalidates all rotator queries. Pass a function that calls
 * one of the `rotatorApi.*` mutators.
 */
export const useRotatorActions = (clusterId: string | null | undefined) => {
    const qc = useQueryClient();
    const [saving, setSaving] = useState(false);

    const run = useCallback(async (task: () => Promise<unknown>) => {
        if (!clusterId) return;
        setSaving(true);
        try {
            const result = await task();
            // If the mutation returns the config, drop it straight into the cache.
            if (result && typeof result === 'object') {
                const cfg = result as Partial<RotationConfig>;
                if (cfg.clusterId === clusterId) {
                    qc.setQueryData(['rotator', 'config', clusterId], result);
                }
            }
            await qc.invalidateQueries({ queryKey: ['rotator'] });
        } finally {
            setSaving(false);
        }
    }, [clusterId, qc]);

    return { run, saving };
};