'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DealReview {
    id: string;
    offerId: string;
    reviewerName: string;
    comment: string;
    likesCount: number;
    createdAt: number;
    likedByUser?: boolean;
}

interface DealEngagementState {
    likedDeals: Record<string, boolean>;
    savedDeals: Record<string, boolean>;
    likeCounts: Record<string, number>;
    reviewCounts: Record<string, number>;
    reviews: Record<string, DealReview[]>;
    reviewLikedByUser: Record<string, boolean>;

    toggleLikeDeal: (offerId: string) => void;
    toggleSaveDeal: (offerId: string) => void;
    isDealLiked: (offerId: string) => boolean;
    isDealSaved: (offerId: string) => boolean;
    getDealLikeCount: (offerId: string) => number;
    getDealReviewCount: (offerId: string) => number;

    addReview: (offerId: string, review: Omit<DealReview, 'id' | 'createdAt' | 'likesCount' | 'likedByUser'>) => void;
    getReviews: (offerId: string) => DealReview[];
    getReviewPreview: (offerId: string, count?: number) => DealReview[];
    toggleReviewLike: (offerId: string, reviewId: string) => void;
    isReviewLiked: (reviewId: string) => boolean;
}

export const useDealEngagementStore = create<DealEngagementState>()(
    persist(
        (set, get) => ({
            likedDeals: {},
            savedDeals: {},
            likeCounts: {},
            reviewCounts: {},
            reviews: {},
            reviewLikedByUser: {},

            toggleLikeDeal: (offerId) => {
                const { likedDeals, likeCounts } = get();
                const isLiked = likedDeals[offerId];
                set({
                    likedDeals: { ...likedDeals, [offerId]: !isLiked },
                    likeCounts: {
                        ...likeCounts,
                        [offerId]: Math.max(0, (likeCounts[offerId] || 0) + (isLiked ? -1 : 1)),
                    },
                });
            },

            toggleSaveDeal: (offerId) => {
                const { savedDeals } = get();
                set({ savedDeals: { ...savedDeals, [offerId]: !savedDeals[offerId] } });
            },

            isDealLiked: (offerId) => !!get().likedDeals[offerId],
            isDealSaved: (offerId) => !!get().savedDeals[offerId],
            getDealLikeCount: (offerId) => get().likeCounts[offerId] || 0,
            getDealReviewCount: (offerId) => get().reviewCounts[offerId] || 0,

            addReview: (offerId, review) => {
                const { reviews, reviewCounts } = get();
                const newReview: DealReview = {
                    ...review,
                    id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    createdAt: Date.now(),
                    likesCount: 0,
                    likedByUser: false,
                };
                const existing = reviews[offerId] || [];
                set({
                    reviews: { ...reviews, [offerId]: [newReview, ...existing] },
                    reviewCounts: { ...reviewCounts, [offerId]: (reviewCounts[offerId] || 0) + 1 },
                });
            },

            getReviews: (offerId) => get().reviews[offerId] || [],

            getReviewPreview: (offerId, count = 3) => {
                const all = get().reviews[offerId] || [];
                return all.slice(0, count);
            },

            toggleReviewLike: (offerId, reviewId) => {
                const { reviews, reviewLikedByUser } = get();
                const isLiked = reviewLikedByUser[reviewId];
                const updated = (reviews[offerId] || []).map((r) =>
                    r.id === reviewId
                        ? { ...r, likesCount: Math.max(0, r.likesCount + (isLiked ? -1 : 1)) }
                        : r
                );
                set({
                    reviews: { ...reviews, [offerId]: updated },
                    reviewLikedByUser: { ...reviewLikedByUser, [reviewId]: !isLiked },
                });
            },

            isReviewLiked: (reviewId) => !!get().reviewLikedByUser[reviewId],
        }),
        {
            name: 'vemtap-deal-engagement',
            partialize: (state) => ({
                likedDeals: state.likedDeals,
                savedDeals: state.savedDeals,
                likeCounts: state.likeCounts,
                reviewCounts: state.reviewCounts,
                reviews: state.reviews,
                reviewLikedByUser: state.reviewLikedByUser,
            }),
        }
    )
);
