import { create } from 'zustand';
import { Sparkles, Megaphone, Zap, Gift } from 'lucide-react';

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
}

interface BannerState {
    slides: BannerSlide[];
    loading: boolean;
    error: string | null;
    setSlides: (slides: BannerSlide[]) => void;
    fetchBanners: () => Promise<void>;
}

export const useBannerStore = create<BannerState>()((set) => ({
    slides: [],
    loading: false,
    error: null,
    setSlides: (slides) => set({ slides }),
    fetchBanners: async () => {
        try {
            set({ loading: true, error: null });
            const { bannersApi } = await import('@/lib/api/banners');
            const data = await bannersApi.getActive();
            const slides = Array.isArray(data) ? data : data?.data || [];
            set({ slides, loading: false });
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
