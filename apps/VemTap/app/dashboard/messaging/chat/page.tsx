'use client';

import React, { Suspense } from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';
import { useChatStore } from '@/lib/store/useChatStore';

export default function ChatPage() {
    const activeConversationId = useChatStore(s => s.activeConversationId);

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white">Loading Chat...</div>}>
            <div className="w-full h-full flex flex-col md:flex-row bg-white overflow-hidden min-h-0 relative">
                {/* Chat Sidebar: Hidden on mobile when a chat is active */}
                <div className={`
                    w-full md:w-80 lg:w-96 flex flex-col h-full shrink-0 border-r border-gray-100
                    ${activeConversationId ? 'hidden md:flex' : 'flex'}
                `}>
                    <ChatSidebar mode="INTERNAL" />
                </div>

                {/* Chat Window: Full screen on mobile, hidden when no chat is active */}
                <div className={`
                    flex-1 min-w-0 h-full flex flex-col
                    ${activeConversationId ? 'flex' : 'hidden md:flex'}
                `}>
                    <ChatWindow />
                </div>
            </div>
        </Suspense>
    );
}
