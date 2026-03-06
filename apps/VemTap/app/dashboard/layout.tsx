'use client';

import React, { useEffect, Suspense } from 'react';
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
        <Suspense fallback={
            <div className="flex items-center justify-center p-8 h-screen">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        }>
            <DashboardSidebar>
                {children}
            </DashboardSidebar>
        </Suspense>
    );
}
