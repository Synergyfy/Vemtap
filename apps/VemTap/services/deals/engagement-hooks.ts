import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as engagementApi from './engagement';
import type { CreateReviewDto } from './types';

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

export const useToggleSave = (offerId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => engagementApi.toggleSave(offerId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['deals', 'engagement', offerId] });
        },
    });
};
