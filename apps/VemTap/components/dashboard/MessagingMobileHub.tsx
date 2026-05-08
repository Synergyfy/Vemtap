'use client';

import React from 'react';
import Link from 'next/link';
import { 
    MessageCircle, MessageSquare, Send, Mail
} from 'lucide-react';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function MessagingMobileHub() {
    const { getLinkWithBranch } = useActiveBranch();

    const messagingActions = [
        { label: 'In-App Chat', href: '/dashboard/messaging/chat', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600', description: 'Live support' },
        { label: 'WhatsApp', href: '/dashboard/messaging/whatsapp', icon: MessageSquare, color: 'bg-green-50 text-green-600', description: 'Direct reach' },
        { label: 'SMS Blast', href: '/dashboard/messaging/sms', icon: Send, color: 'bg-blue-50 text-blue-600', description: 'Quick alerts' },
        { label: 'Email Campaign', href: '/dashboard/messaging/email', icon: Mail, color: 'bg-indigo-50 text-indigo-600', description: 'Formal updates' },
    ];

    return (
        <div className="lg:hidden w-full px-4 pb-12 space-y-4">
            <div className="flex flex-col gap-4">
                {messagingActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                        <Link 
                            key={action.href}
                            href={getLinkWithBranch(action.href)}
                            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 active:scale-95 transition-all"
                        >
                            <div className={`p-4 ${action.color} rounded-2xl`}>
                                <ActionIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">{action.label}</h3>
                                <p className="text-xs text-gray-500 font-medium">{action.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
