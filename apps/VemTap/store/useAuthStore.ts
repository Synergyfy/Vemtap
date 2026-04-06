import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cookie helpers for middleware auth sync
const setAuthCookie = (token: string) => {
  if (typeof document === 'undefined') return;
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  document.cookie = `vemtap-auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const clearAuthCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'vemtap-auth-token=; path=/; max-age=0; SameSite=Lax';
};

export type UserRole = 'owner' | 'manager' | 'staff' | 'admin' | 'customer' | null;
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise' | string;
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | string;

export interface UserEngagement {
  reviewUrl?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  showReview?: boolean;
  showSocial?: boolean;
  showFeedback?: boolean;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  isPasswordChanged: boolean;
  businessId?: string;
  branchId?: string;
  businessName?: string;
  businessLogo?: string;
  avatar?: string;

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
  permissions?: string[];
  engagement?: UserEngagement;
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

      login: (userData: User, access_token: string) => {
        console.log('[AUTH] login() called', { email: userData?.email, role: userData?.role });       
        
        // Clear chat history on login to ensure fresh session
        try {
          import('./chatStore').then((module) => {
            if (module.useChatStore) {
              module.useChatStore.getState().clearHistory();
            }
          }).catch(err => console.error('Failed to clear main chat history on login:', err));

          import('@/lib/store/useChatStore').then((module) => {
            if (module.useChatStore) {
              module.useChatStore.getState().reset();
            }
          }).catch(err => console.error('Failed to clear dashboard chat history on login:', err));
        } catch (e) {
          console.error('Error clearing chat history during login', e);
        }

        if (userData?.role) {
          userData.role = userData.role.toLowerCase() as UserRole;
        }

        // Sync activeBranchId with the user's branchId to prevent stale dashboard views
        const branchIdToSet = userData.branchId || null;
        
        set({ 
          user: userData, 
          access_token, 
          isAuthenticated: true, 
          activeBranchId: branchIdToSet 
        });
        
        setAuthCookie(access_token);
        console.log('[AUTH] Login complete, isAuthenticated:', true, 'Active Branch:', branchIdToSet);
      },

      signup: (userData: User, access_token: string) => {
        console.log('[AUTH] signup() called', { email: userData?.email });
        if (userData?.role) {
          userData.role = userData.role.toLowerCase() as UserRole;
        }
        
        // Sync activeBranchId on signup as well
        const branchIdToSet = userData.branchId || null;
        
        set({ 
          user: userData, 
          access_token, 
          isAuthenticated: true, 
          activeBranchId: branchIdToSet 
        });
        
        setAuthCookie(access_token);
      },


      logout: () => {
        console.log('[AUTH] 🚪 logout() called');
        
        // 1. Clear Google Session if it exists
        if (typeof window !== 'undefined') {
          try {
            import('@react-oauth/google').then((module) => {
              if (module.googleLogout) {
                module.googleLogout();
                console.log('[AUTH] Google logout successful');
              }
            });
          } catch (e) {
            console.error('Failed to logout of Google:', e);
          }
        }

        // 2. Clear chat history to prevent leakage between accounts
        try {
          // Main chatStore
          import('./chatStore').then((module) => {
            if (module.useChatStore) {
              module.useChatStore.getState().clearHistory();
            }
          }).catch(err => console.error('Failed to clear main chat history:', err));

          // Lib/Dashboard useChatStore
          import('@/lib/store/useChatStore').then((module) => {
            if (module.useChatStore) {
              module.useChatStore.getState().reset();
            }
          }).catch(err => console.error('Failed to clear dashboard chat history:', err));
        } catch (e) {
          console.error('Error clearing chat history during logout', e);
        }

        // 3. Explicitly purge local storage keys
        if (typeof window !== 'undefined') {
          localStorage.removeItem('chat-history');
          localStorage.removeItem('vemtap-chat-storage');
        }

        set({ 
          user: null, 
          access_token: null, 
          isAuthenticated: false, 
          activeBranchId: null 
        });
        clearAuthCookie();
        
        // Clear persistent local storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage-v2');
          localStorage.removeItem('business-storage');
          localStorage.removeItem('chat-history'); // Directly clear the persist key
          localStorage.removeItem('business-forms-storage-v1'); // Clear forms as well to be safe
        }
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
        } catch (error: unknown) {
          // Fallback to optimistic update if API not ready
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...data } });
          }
          const errorMessage = error instanceof Error ? error.message : 'Update failed';
          return { success: false, error: errorMessage };
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
        } catch (error: unknown) {
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

