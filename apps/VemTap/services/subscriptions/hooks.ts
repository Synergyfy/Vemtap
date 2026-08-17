import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Subscription, SubscriptionCapabilities, SubscribeRequest } from './types';
import { subscriptionsApi, previewSubscriptionPrice } from '@/lib/api/subscriptions';
import type { SubscriptionTaxConfig, PricePreviewResponse, UpdateSubscriptionTaxPayload, ToggleSubscriptionTaxPayload, BillingPeriod } from '@/types/subscriptions';

export const useActiveSubscription = () => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.access_token);
    const businessId = user?.businessId;
    
    return useQuery<Subscription, Error>({
        // Scope the key to the business AND session token so a stale cache entry
        // from a previous account can never be served on a different account,
        // even across a client-side (no page reload) account switch.
        queryKey: ['subscription', 'active', businessId, token ?? 'anon'],
        queryFn: async ({ signal }) => {
            return await api.get('/subscriptions/active', { signal });
        },
        enabled: !!businessId,
    });
};

export const useCapabilities = () => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.access_token);
    const businessId = user?.businessId;
    
    return useQuery<SubscriptionCapabilities, Error>({
        queryKey: ['subscription', 'capabilities', businessId, token ?? 'anon'],
        queryFn: async ({ signal }) => {
            return await api.get('/subscriptions/capabilities', { signal });
        },
        enabled: !!businessId,
    });
};

import { useSubscriptionStore } from '@/store/useSubscriptionStore';

export const useSubscribe = () => {
    const queryClient = useQueryClient();
    const refreshSubscriptionData = useSubscriptionStore((state) => state.refreshSubscriptionData);

    return useMutation<Subscription, Error, SubscribeRequest>({
        mutationFn: async (dto) => await api.post('/subscriptions/subscribe', dto),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'capabilities'] });
            // Silently refresh the Zustand store so the active plan updates
            // immediately without unmounting/remounting the current page
            refreshSubscriptionData();
            // Write the plan onto the auth store immediately so dashboard gating
            // (hasPlan) never sees a stale "no plan" state right after paying.
            useAuthStore.setState((s) => ({
                user: s.user ? { ...s.user, planId: variables.planId } : s.user,
            }));
        },
    });
};

// ---------------------------------------------------------------
// Subscription VAT / Tax hooks
// ---------------------------------------------------------------

export const useTaxConfig = (enabled = true) =>
    useQuery<SubscriptionTaxConfig, Error>({
        queryKey: ['subscription', 'tax', 'config'],
        queryFn: () => subscriptionsApi.getTaxConfig(),
        enabled,
        staleTime: 5 * 60_000,
    });

export const useTaxHistory = (enabled = true) =>
    useQuery<SubscriptionTaxConfig[], Error>({
        queryKey: ['subscription', 'tax', 'history'],
        queryFn: () => subscriptionsApi.getTaxHistory(),
        enabled,
    });

export const useUpdateTaxConfig = () => {
    const queryClient = useQueryClient();
    return useMutation<SubscriptionTaxConfig, Error, UpdateSubscriptionTaxPayload>({
        mutationFn: (payload) => subscriptionsApi.updateTaxConfig(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'tax', 'config'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'tax', 'history'] });
        },
    });
};

export const useToggleTaxConfig = () => {
    const queryClient = useQueryClient();
    return useMutation<SubscriptionTaxConfig, Error, ToggleSubscriptionTaxPayload>({
        mutationFn: (payload) => subscriptionsApi.toggleTaxConfig(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'tax', 'config'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'tax', 'history'] });
        },
    });
};

export const usePricePreview = (params: {
    planId?: string;
    billingPeriod: BillingPeriod;
    addonIds?: string[];
    enabled?: boolean;
}) =>
    useQuery<PricePreviewResponse, Error>({
        queryKey: ['subscription', 'price-preview', params.planId, params.billingPeriod, params.addonIds],
        queryFn: () =>
            previewSubscriptionPrice({
                planId: params.planId as string,
                billingPeriod: params.billingPeriod,
                addonIds: params.addonIds,
                addonQuantities: params.addonIds?.map(() => 1),
            }),
        enabled: !!params.planId && (params.enabled ?? true),
        staleTime: 30_000,
    });
