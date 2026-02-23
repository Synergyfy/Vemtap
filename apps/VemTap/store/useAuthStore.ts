import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'owner' | 'manager' | 'staff' | 'admin' | 'customer' | null;
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise' | string;

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    businessId?: string;
    branchId?: string;
    businessName?: string;
    businessLogo?: string;
    planId?: string;
    subscriptionStatus?: string;
    status?: string;
}

export interface AuthState {
    user: User | null;
    access_token: string | null;
    isAuthenticated: boolean;
    activeBranchId: string | null; // Globally selected branch for filtering

    login: (userData: User, access_token: string) => void;
    signup: (userData: User, access_token: string) => void; // Often used interchangeably in mock flows
    logout: () => void;
    setActiveBranch: (branchId: string | null) => void;
    updateUser: (updates: Partial<User>) => void;
    subscribe: (planId: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
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

            updateUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                }));
            },

            subscribe: (planId) => {
                set((state) => ({
                    user: state.user ? { ...state.user, planId, subscriptionStatus: 'active' } : null
                }));
            },
        }),
        {
            name: 'auth-storage-v2',
        }
    )
);
