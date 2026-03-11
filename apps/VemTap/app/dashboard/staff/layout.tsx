'use client';

import React from 'react';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return (
        <PageLockWrapper feature="staff" featureName="Team Management">
            {children}
        </PageLockWrapper>
    );
}
