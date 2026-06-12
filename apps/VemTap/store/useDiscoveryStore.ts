import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PromotionType = 'discount' | 'bogo' | 'free_item' | 'event' | 'happy_hour' | 'seasonal' | 'flash_sale' | 'custom';
export type ListingStatus = 'active' | 'inactive';

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived';
  views: number;
  clicks: number;
  conversions: number;
}

interface DiscoveryState {
  isDiscoverable: boolean;
  listingStatus: ListingStatus;
  activePromotions: Promotion[];
  discoveryScore: number;
  
  // Actions
  toggleDiscoveryVisibility: () => void;
  createPromotion: (promo: Promotion) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  resetStore: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set) => ({
      isDiscoverable: true,
      listingStatus: 'active',
      activePromotions: [],
      discoveryScore: 85,

      toggleDiscoveryVisibility: () => set((state) => ({ isDiscoverable: !state.isDiscoverable })),
      
      createPromotion: (promo) => set((state) => ({ activePromotions: [...state.activePromotions, promo] })),
      
      updatePromotion: (id, updates) => set((state) => ({
        activePromotions: state.activePromotions.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      resetStore: () => set({
        isDiscoverable: true,
        listingStatus: 'active',
        activePromotions: [],
        discoveryScore: 85,
      }),
    }),
    {
      name: 'vemtap-discovery-storage',
    }
  )
);
