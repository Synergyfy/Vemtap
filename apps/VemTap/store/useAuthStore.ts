import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'owner' | 'manager' | 'staff' | 'admin' | 'customer' | null;

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    businessId?: string;
    branchId?: string;
    businessName?: string;
    planId?: string;
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

