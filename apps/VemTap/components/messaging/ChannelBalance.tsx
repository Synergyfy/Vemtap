'use client';

import React from 'react';
import { Wallet, Loader2, Plus } from 'lucide-react';
import { useMyCredits } from '@/services/messaging/hooks';

interface ChannelBalanceProps {
    channel: 'whatsapp' | 'sms' | 'email';
    onTopUp?: () => void;
    compact?: boolean;
}

export default function ChannelBalance({ channel, onTopUp, compact = false }: ChannelBalanceProps) {
    const { data: credits, isLoading } = useMyCredits();

    const balanceMap = {
        whatsapp: credits?.whatsappCredits ?? 0,
        sms: credits?.smsCredits ?? 0,
        email: credits?.emailCredits ?? 0,
    };

    const labelMap = {
        whatsapp: 'WhatsApp',
        sms: 'SMS',
        email: 'Email',
    };

    const balance = balanceMap[channel];
    const label = labelMap[channel];

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-lg">
                    <Wallet size={14} className="text-primary" />
                    <span className="text-sm font-bold text-text-main">
                        {isLoading ? '...' : balance.toLocaleString()}
                    </span>
                </div>
                {onTopUp && (
                    <button
                        onClick={onTopUp}
                        className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                            {label} Balance
                        </p>
                        {isLoading ? (
                            <Loader2 className="animate-spin text-primary" size={20} />
                        ) : (
                            <p className="text-xl font-display font-black text-text-main">
                                {balance.toLocaleString()} <span className="text-sm font-bold text-primary">Points</span>
                            </p>
                        )}
                    </div>
                </div>
                {onTopUp && (
                    <button
                        onClick={onTopUp}
                        className="px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-colors"
                    >
                        Add Credits
                    </button>
                )}
            </div>
        </div>
    );
}
