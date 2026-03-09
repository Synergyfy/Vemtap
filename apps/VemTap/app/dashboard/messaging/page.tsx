'use client';

import React from 'react';
import MessagingOverview from '@/components/messaging/MessagingOverview';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function MessagingPage() {
    return (
        <PageLockWrapper feature="messages" featureName="Messaging Center">
            <MessagingOverview />
        </PageLockWrapper>
    );
}
