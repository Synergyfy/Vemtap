import { api, publicApi } from '@/lib/api';
import type {
    DealReview,
    DealReviewsResponse,
    DealEngagementResponse,
    DealReactionResponse,
    DealSaveResponse,
    CreateReviewDto,
    BusinessReviewsQueryParams,
    BusinessReviewsResponse,
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
    publicApi.get(`/deals/${offerId}/engagement`);

// ─── Merchant Review Management ───────────────────────────────────────────────

export const getBusinessReviews = (params?: BusinessReviewsQueryParams): Promise<BusinessReviewsResponse> => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.offerId) q.set('offerId', params.offerId);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api.get(`/deals/business/reviews?${q.toString()}`);
};

export const approveReview = (reviewId: string): Promise<{ id: string; status: 'approved' }> =>
    api.post(`/deals/business/reviews/${reviewId}/approve`);

export const rejectReview = (reviewId: string): Promise<{ id: string; status: 'rejected' }> =>
    api.post(`/deals/business/reviews/${reviewId}/reject`);

export const deleteReview = (reviewId: string): Promise<void> =>
    api.delete(`/deals/business/reviews/${reviewId}`);

// ─── Moderation Toggle (Platinum Gated) ───────────────────────────────────────

export const updateModerationSetting = (requireReviewApproval: boolean): Promise<{ id: string; requireReviewApproval: boolean }> =>
    api.patch('/businesses/my-business', { requireReviewApproval });
