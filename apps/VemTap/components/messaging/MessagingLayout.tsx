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

    if (isChatRoute) {
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
        <div className="h-full flex flex-col bg-gray-50">
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 relative">
                <div className="h-full w-full max-w-7xl mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );

    return (
        <PageLockWrapper feature="messages" featureName="Messaging Center">
            {content}
        </PageLockWrapper>
    );
}
