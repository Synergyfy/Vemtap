import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';

interface SubscriptionState {
    plans: PricingPlan[];
    isLoading: boolean;
    getPlan: (planId?: string) => PricingPlan | undefined;
    canAddTag: (currentTagCount: number) => boolean;
    hasReachedTeamLimit: (currentTeamCount: number) => boolean;
    hasReachedVisitorLimit: (currentVisitorCount: number) => boolean;
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
        return true; // Tags are now unlimited
    },

    hasReachedTeamLimit: (currentTeamCount) => {
        const plan = get().getPlan();
        if (!plan) return false;
        if (plan.teamMembersLimit === -1) return false;
        return currentTeamCount >= plan.teamMembersLimit;
    },

    hasReachedVisitorLimit: (currentVisitorCount) => {
        const plan = get().getPlan();
        if (!plan) return false;
        if (plan.teamMembersLimit === -1) return false;
        return currentVisitorCount >= (plan.teamMembersLimit * 100);
    }
}));

// Initialize plans
if (typeof window !== 'undefined') {
    useSubscriptionStore.getState().fetchPlans();
}
