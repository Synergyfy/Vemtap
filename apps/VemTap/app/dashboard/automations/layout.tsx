'use client';

import React from 'react';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function AutomationsLayout({ children }: { children: React.ReactNode }) {
    return (
        <PageLockWrapper feature="engagement" featureName="Smart Automations">
            {children}
        </PageLockWrapper>
    );
}
