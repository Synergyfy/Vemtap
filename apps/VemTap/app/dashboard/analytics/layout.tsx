'use client';

import React from 'react';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return (
        <PageLockWrapper feature="analytics" featureName="Analytics">
            {children}
        </PageLockWrapper>
    );
}
