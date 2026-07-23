'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, MessageSquare } from 'lucide-react';
import PageLockWrapper from '../dashboard/PageLockWrapper';

interface MessagingLayoutProps {
    children: React.ReactNode;
}

export default function MessagingLayout({ children }: MessagingLayoutProps) {
    const pathname = usePathname();
    const isChatRoute = pathname.includes('/messaging/chat');
    const isCreditsRoute = pathname.includes('/messaging/credits');

    if (isChatRoute || isCreditsRoute) {
        return (
            <div className="h-full min-h-0 flex flex-col bg-gray-50">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="h-full min-h-0 w-full max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    const content = (
        <div className="min-h-full bg-gray-50">
            {/* Content Area */}
            <div className="w-full max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );

    return (
        <PageLockWrapper feature="messages" featureName="Channels">
            {content}
        </PageLockWrapper>
    );
}
