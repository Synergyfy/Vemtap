import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'owner' | 'manager' | 'staff' | 'admin' | 'customer' | null;
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise' | string;
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | string;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessId?: string;
  branchId?: string;
  businessName?: string;
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
  engagement?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  access_token: string | null;
  isAuthenticated: boolean;
  activeBranchId: string | null; // Globally selected branch for filtering

  login: (userData: User, access_token: string) => void;
  signup: (userData: User, access_token: string) => void;
  logout: () => void;
  setActiveBranch: (branchId: string | null) => void;
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  subscribe: (planId: SubscriptionPlan) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      isAuthenticated: false,
      activeBranchId: null,

      login: (userData, access_token) => {
        set({ user: userData, access_token, isAuthenticated: true });
      },

      signup: (userData, access_token) => {
        set({ user: userData, access_token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, access_token: null, isAuthenticated: false, activeBranchId: null });
      },

      setActiveBranch: (branchId) => {
        set({ activeBranchId: branchId });
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
          // Fallback to optimistic update if API not ready
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...data } });
          }
          return { success: false, error: error.message || 'Update failed' };
        }
      },

      subscribe: async (planId: SubscriptionPlan) => {
        const { user } = get();
        if (!user) return { success: false, error: 'User not found' };

        try {
          // Update user's planId locally for now
          // You can add API call here later
          set({ user: { ...user, planId, subscriptionStatus: 'active' } });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: 'Failed to subscribe' };
        }
      }
    }),
    {
      name: 'auth-storage-v2',
    }
  )
);

/**
 * Hook to check if the current user has access based on their role.
 * @param allowedRoles Array of roles that are allowed to access the resource.
 * @returns boolean
 */
export function useCanAccess(allowedRoles: UserRole[]): boolean {
  const userRole = useAuthStore((state) => state.user?.role);
  if (!userRole) return false;
  return allowedRoles.includes(userRole.toLowerCase() as UserRole);
}

