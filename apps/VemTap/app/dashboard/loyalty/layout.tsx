'use client';

import React from 'react';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function LoyaltyLayout({ children }: { children: React.ReactNode }) {
    return (
        <PageLockWrapper feature="loyalty" featureName="Loyalty Programs">
            {children}
        </PageLockWrapper>
    );
}
