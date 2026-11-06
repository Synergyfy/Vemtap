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

export const createReview = async (offerId: string, dto: CreateReviewDto) => {
    return api.post(`/deals/${offerId}/reviews`, dto);
};

export const listReviews = async (offerId: string, page = 1, limit = 10): Promise<DealReviewsResponse> => {
    try {
        return await api.get(`/deals/${offerId}/reviews`, { params: { page, limit } });
    } catch {
        return { reviews: [], total: 0, page };
    }
};

export const previewReviews = async (offerId: string): Promise<{ reviews: DealReview[] }> => {
    try {
        return await api.get(`/deals/${offerId}/reviews/preview`);
    } catch {
        return { reviews: [] };
    }
};

export const toggleReviewLike = async (
    offerId: string,
    reviewId: string
): Promise<{ liked: boolean; likesCount: number }> => {
    return api.post(`/deals/${offerId}/reviews/${reviewId}/like`, {});
};

// ─── Reactions (like / dislike) ───────────────────────────────────────────────

export const setReaction = async (
    offerId: string,
    type: 'like' | 'dislike'
): Promise<DealReactionResponse> => {
    return api.post(`/deals/${offerId}/reactions`, { type });
};

export const getReactionStatus = async (offerId: string): Promise<DealReactionResponse> => {
    try {
        return await api.get(`/deals/${offerId}/reaction-status`);
    } catch {
        return { type: null, likesCount: 0, dislikesCount: 0 };
    }
};

// ─── Saves (bookmarks) ────────────────────────────────────────────────────────

export const toggleSave = async (offerId: string): Promise<DealSaveResponse> => {
    return api.post(`/deals/${offerId}/save`, {});
};

export const getSaveStatus = async (offerId: string): Promise<{ isSaved: boolean }> => {
    try {
        return await api.get(`/deals/${offerId}/save-status`);
    } catch {
        return { isSaved: false };
    }
};

export const getSavedDeals = async (page = 1, limit = 20): Promise<{ data: any[]; total: number; page: number; totalPages: number }> => {
    try {
        return await api.get('/deals/saved', { params: { page, limit } });
    } catch {
        return { data: [], total: 0, page, totalPages: 0 };
    }
};

// ─── Engagement summary ───────────────────────────────────────────────────────

export const getEngagement = async (offerId: string): Promise<DealEngagementResponse> => {
    try {
        return await publicApi.get(`/deals/${offerId}/engagement`);
    } catch {
        return { likesCount: 0, dislikesCount: 0, reviewsCount: 0, averageRating: null, type: null, isSaved: false };
    }
};

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
    api.post(`/deals/business/reviews/${reviewId}/approve`, {});

export const rejectReview = (reviewId: string): Promise<{ id: string; status: 'rejected' }> =>
    api.post(`/deals/business/reviews/${reviewId}/reject`, {});

export const deleteReview = (reviewId: string): Promise<void> =>
    api.delete(`/deals/business/reviews/${reviewId}`);

// ─── Moderation Toggle (Platinum Gated) ───────────────────────────────────────

export const updateModerationSetting = (requireReviewApproval: boolean): Promise<{ id: string; requireReviewApproval: boolean }> =>
    api.patch('/businesses/my-business', { requireReviewApproval });
