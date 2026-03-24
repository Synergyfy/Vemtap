'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminSidebar>
            <React.Suspense fallback={<div className="p-8 animate-pulse text-center">Loading...</div>}>
                {children}
            </React.Suspense>
        </AdminSidebar>
    );
}
