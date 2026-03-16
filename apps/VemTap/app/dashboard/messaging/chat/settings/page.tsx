'use client';

import React, { Suspense } from 'react';
import ChatSettingsPanel from '@/components/messaging/ChatSettingsPanel';

export default function ChatSettingsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50">Loading Settings...</div>}>
            <ChatSettingsPanel />
        </Suspense>
    );
}
