'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Robust hook for managing active branch state.
 * Uses URL Search Params (?branchId=...) as the primary source of truth.
 * Persists the selection across page navigations by ensuring the URL is updated.
 */
export function useActiveBranch() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { activeBranchId: storeBranchId, setActiveBranch: setStoreBranch } = useAuthStore();

    // 1. Get branchId from URL and sanitize it (ignore 'all')
    const rawUrlId = searchParams.get('branchId');
    const urlBranchId = (rawUrlId === 'all' || !rawUrlId) ? null : rawUrlId;
    const effectiveBranchId = urlBranchId ?? storeBranchId;

    // 2. Sync URL to Store
    // This ensures that even if a user manually changes the URL, the store (and legacy components) stay in sync.
    useEffect(() => {
        if (urlBranchId && urlBranchId !== storeBranchId) {
            setStoreBranch(urlBranchId);
        }
    }, [urlBranchId, storeBranchId, setStoreBranch]);

    // 3. Method to update branch (updates URL; store sync happens via effect)
    const setActiveBranch = useCallback((id: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Clean ID: null, undefined, or 'all' should result in no branchId in URL
        const cleanId = (id === 'all' || !id) ? null : id;

        if (cleanId) {
            params.set('branchId', cleanId);
        } else {
            params.delete('branchId');
        }
        
        // Sync to store immediately for smoother transition
        setStoreBranch(cleanId);
        
        const query = params.toString();
        const newUrl = `${pathname}${query ? `?${query}` : ''}`;
        
        // Use router.replace to update the URL without adding to history
        router.replace(newUrl);
    }, [pathname, router, searchParams, setStoreBranch]);

    return {
        // Source of truth is the sanitized URL ID
        activeBranchId: effectiveBranchId,
        setActiveBranch,
        isAllBranches: !effectiveBranchId,
        
        /**
         * Helper to append current branchId to any href
         */
        getLinkWithBranch: (href: string) => {
            if (!effectiveBranchId) return href;
            
            // Handle both absolute paths and relative paths
            const isAbsolute = href.startsWith('http');
            const baseUrl = (isAbsolute || typeof window === 'undefined') ? undefined : window.location.origin;
            
            try {
                const url = new URL(href, baseUrl || 'https://localhost');
                url.searchParams.set('branchId', effectiveBranchId);
                
                if (isAbsolute) return url.toString();
                
                // For relative URLs, just return the path + search + hash
                const result = `${url.pathname}${url.search}${url.hash}`;
                return result;
            } catch (e) {
                // Fallback for malformed URLs
                const separator = href.includes('?') ? '&' : '?';
                return `${href}${separator}branchId=${effectiveBranchId}`;
            }
        }
    };
}
