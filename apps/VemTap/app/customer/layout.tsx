'use client';

import React, { Suspense } from 'react';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { useSearchParams } from 'next/navigation';
import AdminViewerBanner from '@/components/admin/control-tower/AdminViewerBanner';

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const searchParams = useSearchParams();
    const isAdminMode = searchParams.get('admin_mode') === '1';
    const customerUid = searchParams.get('customer_uid');

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CustomerSidebar>
                {isAdminMode && <AdminViewerBanner subjectId={customerUid} type="customer" />}
                {children}
            </CustomerSidebar>
        </Suspense>
    );
}
