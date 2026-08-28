import { api } from '@/lib/api';
import type {
    DealReview,
    DealReviewsResponse,
    DealEngagementResponse,
    DealReactionResponse,
    DealSaveResponse,
    CreateReviewDto,
} from './types';

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const createReview = (offerId: string, dto: CreateReviewDto) =>
    api.post(`/deals/${offerId}/reviews`, dto);

export const listReviews = (offerId: string, page = 1, limit = 10): Promise<DealReviewsResponse> =>
    api.get(`/deals/${offerId}/reviews`, { params: { page, limit } });

export const previewReviews = (offerId: string): Promise<{ reviews: DealReview[] }> =>
    api.get(`/deals/${offerId}/reviews/preview`);

export const toggleReviewLike = (
    offerId: string,
    reviewId: string
): Promise<{ liked: boolean; likesCount: number }> =>
    api.post(`/deals/${offerId}/reviews/${reviewId}/like`);

// ─── Reactions (like / dislike) ───────────────────────────────────────────────

export const setReaction = (
    offerId: string,
    type: 'like' | 'dislike'
): Promise<DealReactionResponse> =>
    api.post(`/deals/${offerId}/reactions`, { type });

export const getReactionStatus = (offerId: string): Promise<DealReactionResponse> =>
    api.get(`/deals/${offerId}/reaction-status`);

// ─── Saves (bookmarks) ────────────────────────────────────────────────────────

export const toggleSave = (offerId: string): Promise<DealSaveResponse> =>
    api.post(`/deals/${offerId}/save`);

export const getSaveStatus = (offerId: string): Promise<{ isSaved: boolean }> =>
    api.get(`/deals/${offerId}/save-status`);

// ─── Engagement summary ───────────────────────────────────────────────────────

export const getEngagement = (offerId: string): Promise<DealEngagementResponse> =>
    api.get(`/deals/${offerId}/engagement`);
