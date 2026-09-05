import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as engagementApi from './engagement';
import type { CreateReviewDto, BusinessReviewsQueryParams } from './types';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useEngagement = (offerId: string) =>
    useQuery({
        queryKey: ['deals', 'engagement', offerId],
        queryFn: () => engagementApi.getEngagement(offerId),
        enabled: !!offerId,
    });

export const useReviews = (offerId: string, page = 1, limit = 10) =>
    useQuery({
        queryKey: ['deals', 'reviews', offerId, page],
        queryFn: () => engagementApi.listReviews(offerId, page, limit),
        enabled: !!offerId,
    });

export const useReviewPreview = (offerId: string) =>
    useQuery({
        queryKey: ['deals', 'reviews', 'preview', offerId],
        queryFn: () => engagementApi.previewReviews(offerId),
        enabled: !!offerId,
    });

// ─── Merchant Review Management ──────────────────────────────────────────────

export const useBusinessReviews = (params?: BusinessReviewsQueryParams) =>
    useQuery({
        queryKey: ['deals', 'business-reviews', params],
        queryFn: () => engagementApi.getBusinessReviews(params),
    });

export const useApproveReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reviewId: string) => engagementApi.approveReview(reviewId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deals', 'business-reviews'] });
        },
    });
};

export const useRejectReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reviewId: string) => engagementApi.rejectReview(reviewId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deals', 'business-reviews'] });
        },
    });
};

export const useDeleteReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reviewId: string) => engagementApi.deleteReview(reviewId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deals', 'business-reviews'] });
        },
    });
};

export const useUpdateModerationSetting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (requireReviewApproval: boolean) => engagementApi.updateModerationSetting(requireReviewApproval),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['business'] });
        },
    });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateReview = (offerId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateReviewDto) => engagementApi.createReview(offerId, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deals', 'reviews', offerId] });
            qc.invalidateQueries({ queryKey: ['deals', 'engagement', offerId] });
        },
    });
};

export const useToggleReviewLike = (offerId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reviewId: string) => engagementApi.toggleReviewLike(offerId, reviewId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deals', 'reviews', offerId] });
        },
    });
};

export const useSetReaction = (offerId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (type: 'like' | 'dislike') => engagementApi.setReaction(offerId, type),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deals', 'engagement', offerId] });
        },
    });
};

export const SAVED_DEALS_KEY = 'vemtap_saved_deal_ids';

export const getLocalSavedIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(SAVED_DEALS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
        return [];
    }
};

export const useToggleSave = (offerId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => engagementApi.toggleSave(offerId),
        onSuccess: (data) => {
            try {
                const ids = new Set(getLocalSavedIds());
                if (data?.saved) ids.add(offerId);
                else ids.delete(offerId);
                localStorage.setItem(SAVED_DEALS_KEY, JSON.stringify(Array.from(ids)));
                window.dispatchEvent(new Event('vemtap-saved-changed'));
            } catch {
                // localStorage unavailable — backend remains source of truth
            }
            qc.invalidateQueries({ queryKey: ['deals', 'engagement', offerId] });
            qc.invalidateQueries({ queryKey: ['deals', 'saved'] });
        },
    });
};
