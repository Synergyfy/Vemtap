'use client';

import React from 'react';
import { useSudoStore } from '@/store/useSudoStore';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

interface SudoActionGuardProps {
    children: React.ReactNode;
    action?: string;
    hideInSudo?: boolean;
    disableInSudo?: boolean;
    requiredPermission?: 'VIEW_ONLY' | 'VIEW_EDIT' | 'VIEW_REPLY';
}

/**
 * Guard component to restrict actions during Admin Sudo sessions (Control Tower Step 8).
 */
export default function SudoActionGuard({ 
    children, 
    action = 'This action',
    hideInSudo = false,
    disableInSudo = true,
    requiredPermission 
}: SudoActionGuardProps) {
    const activeSession = useSudoStore(state => state.activeSession);
    const user = useAuthStore(state => state.user);
    const isSudo = activeSession !== null;
    const isAdmin = user?.role === 'admin';

    if (!isSudo) return <>{children}</>;

    // Admins are allowed to perform all actions during impersonation as per requirement.
    // Agents are restricted from destructive actions like deletions, or if explicitly requested via hideInSudo.
    if (isAdmin) {
        // Even for admins, we might want to hide certain things if specifically requested (like download buttons if mandated by security policy)
        // However, the current requirement is to allow admins to delete.
        // We still respect hideInSudo if it's explicitly set.
        if (hideInSudo) return null;
        return <>{children}</>;
    }

    // Agent Restrictions (Step 8: No export/download unless explicitly allowed)
    const isExportOrDownload = action.toLowerCase().includes('export') || action.toLowerCase().includes('download');
    const isDelete = action.toLowerCase().includes('delete');
    
    if (isExportOrDownload || (isDelete && !isAdmin) || hideInSudo) {
        return null; // Restricted for agents
    }

    // Step 7: Permission Enforcement for Agents
    if (requiredPermission && activeSession.permissions) {
        const hasPermission = activeSession.permissions.includes(requiredPermission) || 
                             activeSession.permissions.includes('VIEW_EDIT');
        
        if (!hasPermission) {
            if (disableInSudo) {
                return (
                    <div className="opacity-50 cursor-not-allowed pointer-events-none grayscale" title={`${action} is restricted in your current permission level.`}>
                        {children}
                    </div>
                );
            }
            return null;
        }
    }

    if (disableInSudo) {
        return (
            <div 
                className="opacity-60 cursor-not-allowed filter grayscale transition-all" 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.error(`${action} is restricted for agents during impersonation sessions.`);
                }}
            >
                <div className="pointer-events-none">
                    {children}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
