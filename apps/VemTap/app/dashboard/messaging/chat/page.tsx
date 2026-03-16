'use client';

import React, { Suspense } from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white">Loading Chat...</div>}>
            <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <ChatSidebar />
                <ChatWindow />
            </div>
        </Suspense>
    );
}
