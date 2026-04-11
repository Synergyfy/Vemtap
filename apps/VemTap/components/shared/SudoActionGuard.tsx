'use client';

import React from 'react';
import { useSudoStore } from '@/store/useSudoStore';
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
    const isSudo = activeSession !== null;

    if (!isSudo) return <>{children}</>;

    // Step 8: No export/download unless explicitly allowed (default: restricted)
    const isExportOrDownload = action.toLowerCase().includes('export') || action.toLowerCase().includes('download');
    
    if (isExportOrDownload || hideInSudo) {
        return null; // Restricted by specification Step 8
    }

    // Step 7: Permission Enforcement
    if (requiredPermission && activeSession.permissions) {
        const hasPermission = activeSession.permissions.includes(requiredPermission) || 
                             activeSession.permissions.includes('VIEW_EDIT'); // VIEW_EDIT usually implies others
        
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
                    toast.error(`${action} is restricted during impersonation sessions.`);
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
