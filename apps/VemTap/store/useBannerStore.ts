import { create } from 'zustand';
import { Sparkles, Megaphone, Zap, Gift } from 'lucide-react';
import type { BannerPlacement, BannerTargetType } from '@/lib/api/banners';

export interface BannerSlide {
    id: string;
    title: string;
    description: string;
    iconName: 'Sparkles' | 'Megaphone' | 'Zap' | 'Gift';
    actionLabel?: string;
    actionUrl?: string;
    color: string;
    isActive?: boolean;
    sortOrder?: number;
    placement?: BannerPlacement;
    targetType?: BannerTargetType;
    targetId?: string;
}

interface BannerState {
    businessSlides: BannerSlide[];
    customerSlides: BannerSlide[];
    loading: boolean;
    error: string | null;
    fetchBanners: (placement?: BannerPlacement) => Promise<void>;
}

export const useBannerStore = create<BannerState>()((set) => ({
    businessSlides: [],
    customerSlides: [],
    loading: false,
    error: null,
    fetchBanners: async (placement) => {
        try {
            set({ loading: true, error: null });
            const { bannersApi } = await import('@/lib/api/banners');
            const data = await bannersApi.getActive(placement);
            const slides = Array.isArray(data) ? data : data?.data || [];
            if (placement === 'customer') {
                set({ customerSlides: slides, loading: false });
            } else if (placement === 'business') {
                set({ businessSlides: slides, loading: false });
            } else {
                set({ businessSlides: slides, loading: false });
            }
        } catch (err) {
            set({ error: 'Failed to load banners', loading: false });
        }
    },
}));

export const getIconByName = (name: string) => {
    switch (name) {
        case 'Sparkles': return Sparkles;
        case 'Megaphone': return Megaphone;
        case 'Zap': return Zap;
        case 'Gift': return Gift;
        default: return Sparkles;
    }
};
