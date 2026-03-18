'use client';

import React, { Suspense } from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white">Loading Chat...</div>}>
            <div className="w-full h-full flex flex-col md:flex-row bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-0 relative">
                <div className="w-full md:w-80 lg:w-96 flex flex-col h-[45vh] md:h-full shrink-0 border-r border-gray-100">
                    <ChatSidebar />
                </div>
                <div className="flex-1 min-w-0 h-full flex flex-col">
                    <ChatWindow />
                </div>
            </div>
        </Suspense>
    );
}
