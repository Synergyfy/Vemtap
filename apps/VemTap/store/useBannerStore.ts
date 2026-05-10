import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sparkles, Megaphone, Zap, Gift } from 'lucide-react';

export interface BannerSlide {
    id: string;
    title: string;
    description: string;
    iconName: 'Sparkles' | 'Megaphone' | 'Zap' | 'Gift';
    actionLabel?: string;
    actionUrl?: string;
    color: string;
}

interface BannerState {
    slides: BannerSlide[];
    setSlides: (slides: BannerSlide[]) => void;
    addSlide: (slide: BannerSlide) => void;
    updateSlide: (id: string, slide: Partial<BannerSlide>) => void;
    removeSlide: (id: string) => void;
}

const DEFAULT_SLIDES: BannerSlide[] = [
    {
        id: 'welcome-slide',
        title: 'Welcome to VemTap Dashboard!',
        description: 'Manage your visitors, loyalty programs, and messaging all in one place. Explore our new features to grow your business.',
        iconName: 'Sparkles',
        actionLabel: 'Get Started',
        actionUrl: '/dashboard/engagement/forms',
        color: 'bg-gradient-to-r from-emerald-600 to-teal-500'
    },
    {
        id: 'loyalty-promo',
        title: 'Grow Your Loyalty Program',
        description: 'Did you know? Customers in a loyalty program spend 3x more. Set up your rewards today and watch your business thrive.',
        iconName: 'Gift',
        actionLabel: 'Setup Rewards',
        actionUrl: '/dashboard/loyalty',
        color: 'bg-gradient-to-r from-blue-600 to-indigo-500'
    }
];

export const useBannerStore = create<BannerState>()(
    persist(
        (set) => ({
            slides: DEFAULT_SLIDES,
            setSlides: (slides) => set({ slides }),
            addSlide: (slide) => set((state) => ({ slides: [...state.slides, slide] })),
            updateSlide: (id, updates) => set((state) => ({
                slides: state.slides.map((s) => s.id === id ? { ...s, ...updates } : s)
            })),
            removeSlide: (id) => set((state) => ({
                slides: state.slides.filter((s) => s.id !== id)
            })),
        }),
        {
            name: 'vemtap-banner-storage',
        }
    )
);

export const getIconByName = (name: string) => {
    switch (name) {
        case 'Sparkles': return Sparkles;
        case 'Megaphone': return Megaphone;
        case 'Zap': return Zap;
        case 'Gift': return Gift;
        default: return Sparkles;
    }
};
