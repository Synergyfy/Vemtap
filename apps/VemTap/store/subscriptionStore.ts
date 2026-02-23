import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';

interface SubscriptionState {
    plans: PricingPlan[];
    isLoading: boolean;
    getPlan: (planId?: string) => PricingPlan | undefined;
    canAddTag: (currentTagCount: number) => boolean;
    hasReachedVisitorLimit: (currentVisitorCountValue: number) => boolean;
    fetchPlans: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    plans: [],
    isLoading: false,

    fetchPlans: async () => {
        set({ isLoading: true });
        try {
            const plans = await fetchPricingPlans();
            set({ plans });
        } finally {
            set({ isLoading: false });
        }
    },

    getPlan: (planId) => {
        const { plans } = get();
        const id = planId || useAuthStore.getState().user?.planId || 'free';
        return plans.find(p => p.id === id);
    },

    canAddTag: (currentTagCount) => {
        const plan = get().getPlan();
        if (!plan) return false;
        if (plan.tagLimit === Infinity) return true;
        return currentTagCount < plan.tagLimit;
    },

    hasReachedVisitorLimit: (currentVisitorCountValue) => {
        const plan = get().getPlan();
        if (!plan) return false;
        if (plan.visitorLimit === Infinity) return false;
        return currentVisitorCountValue >= plan.visitorLimit;
    }
}));

// Initialize plans
if (typeof window !== 'undefined') {
    useSubscriptionStore.getState().fetchPlans();
}
