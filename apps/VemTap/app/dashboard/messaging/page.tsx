'use client';

import React from 'react';
import MessagingOverview from '@/components/messaging/MessagingOverview';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import MessagingMobileHub from '@/components/dashboard/MessagingMobileHub';
import PageHeader from '@/components/dashboard/PageHeader';

export default function MessagingPage() {
    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <PageHeader 
                title="Channels"
                description="Monitor your customer engagement across all communication channels"
            />
            
            {/* Mobile Hub View */}
            <MessagingMobileHub />
            
            <div className="hidden md:block">
                <MessagingOverview />
            </div>
        </div>
    );
}
