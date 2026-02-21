import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChatStore } from './chatStore';

export type UserRole = 'owner' | 'manager' | 'staff' | 'admin' | 'customer' | null;
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'white-label' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'none';

interface User {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  businessName?: string;
  businessId?: string;
  businessLogo?: string;
  // Subscription fields
  planId?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: string;
  billingCycleAt?: string;
  phone?: string;
  plan?: string;
  status?: string;
  lastLogin?: string;
  joined?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  signup: (userData: User) => void;
  logout: () => void;
  subscribe: (planId: SubscriptionPlan) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (userData: User) => {
        set({ user: userData, isAuthenticated: true });
      },

      signup: (userData: User) => {
        set({ user: userData, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        useChatStore.getState().clearHistory();
        localStorage.removeItem('chat-history');
      },

      subscribe: async (planId: SubscriptionPlan) => {
        const { user } = get();
        if (!user) return { success: false, error: 'User not found' };

        set({
          user: {
            ...user,
            planId,
            subscriptionStatus: planId === 'free' ? 'active' : 'trialing'
          }
        });
        return { success: true };
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
