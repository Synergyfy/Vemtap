import React, { Suspense } from 'react';
import CustomerSidebar from '@/components/customer/CustomerSidebar';

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CustomerSidebar>
                {children}
            </CustomerSidebar>
        </Suspense>
    );
}
