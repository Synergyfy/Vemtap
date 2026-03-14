'use client';

import React from 'react';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function CustomerChatPage() {
    return (
        <div className="flex h-[calc(100vh-160px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
            <ChatSidebar />
            <ChatWindow />
        </div>
    );
}
