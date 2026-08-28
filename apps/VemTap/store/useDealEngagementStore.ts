'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DealEngagementState {
    likeCounts: Record<string, number>;
    reviewCounts: Record<string, number>;

    getDealLikeCount: (offerId: string) => number;
    getDealReviewCount: (offerId: string) => number;
    setDealCounts: (offerId: string, likes: number, reviews: number) => void;
}

export const useDealEngagementStore = create<DealEngagementState>()(
    persist(
        (set, get) => ({
            likeCounts: {},
            reviewCounts: {},

            getDealLikeCount: (offerId) => get().likeCounts[offerId] || 0,
            getDealReviewCount: (offerId) => get().reviewCounts[offerId] || 0,

            setDealCounts: (offerId, likes, reviews) => {
                set((state) => ({
                    likeCounts: { ...state.likeCounts, [offerId]: likes },
                    reviewCounts: { ...state.reviewCounts, [offerId]: reviews },
                }));
            },
        }),
        {
            name: 'vemtap-deal-engagement',
            partialize: (state) => ({
                likeCounts: state.likeCounts,
                reviewCounts: state.reviewCounts,
            }),
        }
    )
);
