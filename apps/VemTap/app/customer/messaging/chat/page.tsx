'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useChatStore } from '@/lib/store/useChatStore';
import { useSearchParams } from 'next/navigation';

const ChatSidebar = dynamic(() => import('@/components/messaging/ChatSidebar'), { ssr: false });
const ChatWindow = dynamic(() => import('@/components/messaging/ChatWindow'), { ssr: false });

function CustomerChatContent() {
    const activeConversationId = useChatStore((s: any) => s.activeConversationId);
    const searchParams = useSearchParams();
    const hasBranchTarget = !!searchParams.get('branchId') || !!searchParams.get('businessId') || !!searchParams.get('code');

    // When navigating directly to chat with a specific branch (e.g. from "Contact Business"),
    // skip the sidebar on mobile and show the chat window immediately
    const showSidebarOnMobile = !activeConversationId && !hasBranchTarget;

    return (
        <div className="flex flex-col md:flex-row h-full min-h-0 bg-white md:rounded-xl border-y md:border border-gray-200 shadow-sm overflow-hidden md:mx-0 md:mt-0 md:mb-0">
            {/* Sidebar: Hidden on mobile if a chat is active or if navigating with a branch target */}
            <div className={`w-full md:w-80 lg:w-96 flex-col h-full shrink-0 ${showSidebarOnMobile ? 'flex' : 'hidden md:flex'}`}>
                <ChatSidebar />
            </div>

            {/* Window: Hidden on mobile if no chat is active and no branch target */}
            <div className={`flex-1 flex-col h-full min-w-0 ${showSidebarOnMobile ? 'hidden md:flex' : 'flex'}`}>
                <ChatWindow />
            </div>
        </div>
    );
}

export default function CustomerChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white">Loading Chat...</div>}>
            <CustomerChatContent />
        </Suspense>
    );
}
