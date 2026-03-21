'use client';

import React, { Suspense } from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function CustomerChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white">Loading Chat...</div>}>
            <div className="flex h-[calc(100vh-160px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
                <ChatSidebar mode="INTERNAL" />
                <ChatWindow />
            </div>
        </Suspense>
    );
}
