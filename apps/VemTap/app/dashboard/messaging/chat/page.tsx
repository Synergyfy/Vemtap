'use client';

import React, { Suspense } from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';
import { useChatStore } from '@/lib/store/useChatStore';

export default function ChatPage() {
    const activeConversationId = useChatStore(s => s.activeConversationId);

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white">Loading Chat...</div>}>
            <div className="w-full h-full flex flex-col md:flex-row bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-0 relative">
                {/* Sidebar - hidden on mobile when a chat is active */}
                <div className={`w-full md:w-80 lg:w-96 flex flex-col h-full shrink-0 border-r border-gray-100 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <ChatSidebar mode="INTERNAL" />
                </div>
                
                {/* Chat Window - hidden on mobile when no chat is active */}
                <div className={`flex-1 min-w-0 h-full flex flex-col ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <ChatWindow />
                </div>
            </div>
        </Suspense>
    );
}
