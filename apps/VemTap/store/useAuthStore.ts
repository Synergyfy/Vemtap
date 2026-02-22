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
  branchId?: string;
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

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  joined: string;
  businessName?: string;
}

interface SignupResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeBranchId: string | null;
  registeredUsers: RegisteredUser[];
  login: (userData: User, token: string) => void;
  signup: (userData: Partial<User> & { email: string; name: string }) => Promise<SignupResult>;
  logout: () => void;
  setActiveBranch: (branchId: string | null) => void;
  adminCreateUser: (user: Omit<RegisteredUser, 'id'>) => void;
  adminUpdateUser: (id: string, updates: Partial<RegisteredUser>) => void;
  adminDeleteUser: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      activeBranchId: null,
      registeredUsers: [],

      login: (userData: User, token: string) => {
        set({ user: userData, token, isAuthenticated: true });
      },

      signup: async (userData) => {
        try {
          const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substr(2, 16);
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: userData.email,
            name: userData.name,
            role: userData.role || 'owner',
            businessName: userData.businessName,
            planId: userData.planId || 'free',
            subscriptionStatus: userData.subscriptionStatus || 'trialing',
            trialEndsAt: userData.trialEndsAt,
          };
          set({ user: newUser, token: mockToken, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return { success: false, error: 'Signup failed' };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, activeBranchId: null });
        useChatStore.getState().clearHistory();
        localStorage.removeItem('chat-history');
      },

      setActiveBranch: (branchId: string | null) => {
        set({ activeBranchId: branchId });
      },

      adminCreateUser: (userData) => {
        const newUser: RegisteredUser = {
          ...userData,
          id: Math.random().toString(36).substr(2, 9),
        };
        set({ registeredUsers: [...get().registeredUsers, newUser] });
      },

      adminUpdateUser: (id, updates) => {
        set({
          registeredUsers: get().registeredUsers.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
        });
      },

      adminDeleteUser: (id) => {
        set({
          registeredUsers: get().registeredUsers.filter((u) => u.id !== id),
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
