'use client';

import React from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function ChatPage() {
    return (
        <div className="flex h-[calc(100vh-130px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ChatSidebar />
            <ChatWindow />
        </div>
    );
}
