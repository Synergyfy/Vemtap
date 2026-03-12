'use client';

import React from 'react';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function VisitorsLayout({ children }: { children: React.ReactNode }) {
    return (
        <PageLockWrapper feature="visitors" featureName="CRM & Visitors">
            {children}
        </PageLockWrapper>
    );
}
