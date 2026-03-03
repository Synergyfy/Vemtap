'use client';

import React, { useEffect } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const accessToken = useAuthStore((state) => state.access_token);

    // Sync auth cookie for existing sessions (pre-middleware users)
    useEffect(() => {
        if (accessToken) {
            const maxAge = 30 * 24 * 60 * 60;
            document.cookie = `vemtap-auth-token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
    }, [accessToken]);

    return (
        <DashboardSidebar>
            {children}
        </DashboardSidebar>
    );
}
