'use client';


import  { Suspense } from 'react';
import MessageBuilder from '@/components/messaging/MessageBuilder';

export default function ComposeMessagePage() {
    return (
        <Suspense fallback={null}>
            <MessageBuilder />
        </Suspense>
    );
}

