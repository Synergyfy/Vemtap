'use client';

import React, { Suspense } from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';
import { useChatStore } from '@/lib/store/useChatStore';

export default function CustomerChatPage() {
    const activeConversationId = useChatStore((s: any) => s.activeConversationId);

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white">Loading Chat...</div>}>
            <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
                {/* Sidebar: Hidden on mobile if a chat is active */}
                <div className={`w-full md:w-80 lg:w-96 flex-col h-full shrink-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <ChatSidebar mode="INTERNAL" />
                </div>

                {/* Window: Hidden on mobile if no chat is active */}
                <div className={`flex-1 flex-col h-full min-w-0 ${activeConversationId ? 'flex' : 'hidden md:flex'}`}>
                    <ChatWindow />
                </div>
            </div>
        </Suspense>
    );
}
