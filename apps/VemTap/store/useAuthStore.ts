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
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  signup: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  subscribe: (planId: SubscriptionPlan) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData: User, token: string) => {
        set({ user: userData, token, isAuthenticated: true });
      },

      signup: (userData: User, token: string) => {
        set({ user: userData, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        useChatStore.getState().clearHistory();
        localStorage.removeItem('chat-history');
      },

      updateUser: async (data: Partial<User>) => {
        try {
          const { usersApi } = await import('@/lib/api/users');
          const updatedUser = await usersApi.updateMe(data);
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...updatedUser } });
          }
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message || 'Update failed' };
        }
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
