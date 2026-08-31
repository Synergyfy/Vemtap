'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LikedItem {
  id: string;
  type: 'deal' | 'business' | 'product';
  title: string;
  subtitle?: string;
  category: string;
  location: string;
  imageColor: string;
  businessName: string;
  businessSlug: string;
  likedAt: number;
}

export interface SavedItem {
  id: string;
  type: 'deal' | 'business' | 'product';
  title: string;
  subtitle?: string;
  category: string;
  location: string;
  imageColor: string;
  businessName: string;
  businessSlug: string;
  savedAt: number;
}

export interface NotificationSubscription {
  businessSlug: string;
  businessName: string;
  subscribedAt: number;
  source: 'like' | 'save';
}

interface InteractionState {
  likedItems: LikedItem[];
  savedItems: SavedItem[];
  notificationSubscriptions: NotificationSubscription[];
  likeCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  shareCounts: Record<string, number>;

  toggleLike: (item: Omit<LikedItem, 'likedAt'>) => void;
  toggleSave: (item: Omit<SavedItem, 'savedAt'>) => void;
  isLiked: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  getLikeCount: (id: string) => number;
  getCommentCount: (id: string) => number;
  getShareCount: (id: string) => number;
  incrementShare: (id: string) => void;
  isSubscribedToBusiness: (businessSlug: string) => boolean;
}

export const useInteractionStore = create<InteractionState>()(
  persist(
    (set, get) => ({
      likedItems: [],
      savedItems: [],
      notificationSubscriptions: [],
      likeCounts: {},
      commentCounts: {},
      shareCounts: {},

      toggleLike: (item) => {
        const { likedItems, likeCounts, notificationSubscriptions } = get();
        const exists = likedItems.find((i) => i.id === item.id);
        const currentCount = likeCounts[item.id] || 0;

        if (exists) {
          set({
            likedItems: likedItems.filter((i) => i.id !== item.id),
            likeCounts: { ...likeCounts, [item.id]: Math.max(0, currentCount - 1) },
          });
        } else {
          const newSubs = item.type === 'business' && item.businessSlug
            ? notificationSubscriptions.some(s => s.businessSlug === item.businessSlug)
              ? notificationSubscriptions
              : [...notificationSubscriptions, {
                  businessSlug: item.businessSlug,
                  businessName: item.businessName,
                  subscribedAt: Date.now(),
                  source: 'like' as const,
                }]
            : notificationSubscriptions;

          set({
            likedItems: [{ ...item, likedAt: Date.now() }, ...likedItems],
            likeCounts: { ...likeCounts, [item.id]: currentCount + 1 },
            notificationSubscriptions: newSubs,
          });
        }
      },

      toggleSave: (item) => {
        const { savedItems, notificationSubscriptions } = get();
        const exists = savedItems.find((i) => i.id === item.id);

        if (exists) {
          set({ savedItems: savedItems.filter((i) => i.id !== item.id) });
        } else {
          const newSubs = item.type === 'business' && item.businessSlug
            ? notificationSubscriptions.some(s => s.businessSlug === item.businessSlug)
              ? notificationSubscriptions
              : [...notificationSubscriptions, {
                  businessSlug: item.businessSlug,
                  businessName: item.businessName,
                  subscribedAt: Date.now(),
                  source: 'save' as const,
                }]
            : notificationSubscriptions;

          set({
            savedItems: [{ ...item, savedAt: Date.now() }, ...savedItems],
            notificationSubscriptions: newSubs,
          });
        }
      },

      isLiked: (id) => get().likedItems.some((i) => i.id === id),
      isSaved: (id) => get().savedItems.some((i) => i.id === id),
      getLikeCount: (id) => get().likeCounts[id] || 0,
      getCommentCount: (id) => get().commentCounts[id] || 0,
      getShareCount: (id) => get().shareCounts[id] || 0,

      incrementShare: (id) => {
        const { shareCounts } = get();
        set({ shareCounts: { ...shareCounts, [id]: (shareCounts[id] || 0) + 1 } });
      },

      isSubscribedToBusiness: (businessSlug) =>
        get().notificationSubscriptions.some((s) => s.businessSlug === businessSlug),
    }),
    {
      name: 'vemtap-interactions',
      partialize: (state) => ({
        likedItems: state.likedItems,
        savedItems: state.savedItems,
        notificationSubscriptions: state.notificationSubscriptions,
        likeCounts: state.likeCounts,
        commentCounts: state.commentCounts,
        shareCounts: state.shareCounts,
      }),
    }
  )
);
