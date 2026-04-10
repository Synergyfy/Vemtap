'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Modular hook to persist sudo-related query parameters across navigation.
 * These parameters ensure that admin/agent sudo sessions remain active.
 */
export function useUrlPersistence() {
    const searchParams = useSearchParams();

    const getPersistedLink = useCallback((href: string) => {
        if (!href || href.startsWith('#')) return href;

        // Handle both absolute paths and relative paths
        const isAbsolute = href.startsWith('http');
        const baseUrl = (isAbsolute || typeof window === 'undefined') ? undefined : window.location.origin;

        try {
            const url = new URL(href, baseUrl || 'https://localhost');
            
            // Parameters to persist (excluding sudo params now handled by global store)
            const paramsToPersist = ['branchId'];
            
            paramsToPersist.forEach(param => {
                const value = searchParams.get(param);
                if (value && !url.searchParams.has(param)) {
                    url.searchParams.set(param, value);
                }
            });

            if (isAbsolute) return url.toString();
            
            // For relative URLs, return path + search + hash
            return `${url.pathname}${url.search}${url.hash}`;
        } catch (e) {
            // Fallback for malformed URLs
            return href;
        }
    }, [searchParams]);

    return { getPersistedLink };
}
