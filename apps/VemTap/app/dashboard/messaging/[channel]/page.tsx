'use client';

import { notFound } from 'next/navigation';
import ChannelInbox from '@/components/messaging/ChannelInbox';

interface Props {
    params: Promise<{
        channel: string;
    }>;
}

export default async function ChannelPage(props: Props) {
    const params = await props.params;
    const { channel } = params;

    // Map URL param to internal channel type or show 404
    const channelMap: Record<string, 'SMS' | 'WhatsApp' | 'Email'> = {
        'sms': 'SMS',
        'whatsapp': 'WhatsApp',
        'email': 'Email'
    };

    const type = channelMap[channel.toLowerCase()];
    if (!type) return notFound();

    return <ChannelInbox channel={type} />;
}
