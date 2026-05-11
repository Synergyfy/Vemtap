'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useSudoStore } from '@/store/useSudoStore';

export type ActionType = 'delete' | 'create' | 'update' | 'archive' | 'duplicate';

/**
 * Hook to check if the current user is allowed to perform a specific action.
 * Specifically handles restrictions for Agents during Sudo/Impersonation sessions.
 */
export function useActionPermission() {
    const { user } = useAuthStore();
    const { activeSession } = useSudoStore();

    const canPerformAction = (action: ActionType): boolean => {
        // If not in a sudo session, normal RBAC applies (handled by backend usually)
        if (!activeSession) return true;

        // If in sudo session and actor is an agent, restrict DELETE
        const isAgent = user?.role === 'agent';
        
        if (isAgent && action === 'delete') {
            return false;
        }

        // For now, only DELETE is restricted for agents in sudo mode.
        // We can add more restrictions here later if needed.
        return true;
    };

    const getRestrictionMessage = (action: ActionType): string | null => {
        if (!canPerformAction(action)) {
            if (action === 'delete') {
                return 'Agents are not allowed to perform deletions while impersonating.';
            }
            return 'You do not have permission to perform this action in impersonation mode.';
        }
        return null;
    };

    return {
        canPerformAction,
        getRestrictionMessage,
        isImpersonating: !!activeSession,
        isAgent: user?.role === 'agent'
    };
}
