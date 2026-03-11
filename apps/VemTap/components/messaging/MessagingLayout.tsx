'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageLockWrapper from '../dashboard/PageLockWrapper';

interface MessagingLayoutProps {
    children: React.ReactNode;
}

export default function MessagingLayout({ children }: MessagingLayoutProps) {

    return (
        <PageLockWrapper feature="messages" featureName="Messaging Center">
            <div className="h-full flex flex-col bg-gray-50">
                {/* Header / Stats Bar */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-text-main">Messaging Center</h1>
                        <p className="text-text-secondary text-sm">Manage all your communication channels in one place</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/messaging/compose"
                            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 text-sm"
                        >
                            <Plus size={18} />
                            Compose Message
                        </Link>


                    </div>
                </div>



                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    <div className="h-full w-full max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>


            </div>
        </PageLockWrapper>
    );
}
