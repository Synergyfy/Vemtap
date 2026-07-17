'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Globe, Lock, CreditCard, Share2, Languages, Shield, Building2, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsSections = [
    {
        label: 'Payments & Wallet',
        icon: CreditCard,
        items: [
            { label: 'Automatic Subscription Payment', description: 'Auto-pay your monthly subscription from wallet balance', type: 'toggle', value: true },
            { label: 'Withdrawal Bank', description: 'Access Bank · 1234567890 · Chidi Okonkwo', type: 'action' },
            { label: 'Minimum Withdrawal', description: '₦5,000 minimum withdrawal amount', type: 'info' },
        ]
    },
    {
        label: 'Notifications',
        icon: Bell,
        items: [
            { label: 'Referral Rewards', description: 'Get notified when you earn a referral reward', type: 'toggle', value: true },
            { label: 'New Referrals', description: 'Get notified when a business joins through your link', type: 'toggle', value: true },
            { label: 'Milestone Alerts', description: 'Get notified when you reach a new milestone', type: 'toggle', value: true },
            { label: 'Weekly Summary', description: 'Receive weekly partnership performance summary', type: 'toggle', value: false },
        ]
    },
    {
        label: 'Sharing Preferences',
        icon: Share2,
        items: [
            { label: 'Default Share Channel', description: 'WhatsApp is your default sharing channel', type: 'action' },
            { label: 'Auto-generate QR Code', description: 'Automatically generate QR code for new referral links', type: 'toggle', value: true },
            { label: 'Include Business Card', description: 'Attach your partnership card when sharing links', type: 'toggle', value: true },
        ]
    },
    {
        label: 'Privacy & Security',
        icon: Shield,
        items: [
            { label: 'Show on Leaderboard', description: 'Display your business name on the public leaderboard', type: 'toggle', value: true },
            { label: 'Show Earnings Publicly', description: 'Display your earnings on the leaderboard', type: 'toggle', value: false },
            { label: 'Profile Visibility', description: 'Your partnership profile is visible to all businesses', type: 'action' },
        ]
    },
    {
        label: 'Language & Region',
        icon: Globe,
        items: [
            { label: 'Language', description: 'English (Nigeria)', type: 'action' },
            { label: 'Currency', description: 'NGN - Nigerian Naira', type: 'action' },
            { label: 'Region', description: 'Lagos, Nigeria', type: 'action' },
        ]
    },
];

export default function PartnershipSettingsPage() {
    const [toggles, setToggles] = useState<Record<string, boolean>>({
        'Automatic Subscription Payment': true,
        'Referral Rewards': true,
        'New Referrals': true,
        'Milestone Alerts': true,
        'Weekly Summary': false,
        'Auto-generate QR Code': true,
        'Include Business Card': true,
        'Show on Leaderboard': true,
        'Show Earnings Publicly': false,
    });

    const toggle = (label: string) => {
        setToggles(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <div className="max-w-3xl space-y-5 md:space-y-6">
            {settingsSections.map((section, si) => {
                const Icon = section.icon;
                return (
                    <motion.div
                        key={section.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: si * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-50">
                            <div className="size-8 md:size-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                <Icon size={16} />
                            </div>
                            <h3 className="text-xs md:text-sm font-semibold text-gray-900">{section.label}</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {section.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        <p className="text-xs md:text-sm font-medium text-gray-900">{item.label}</p>
                                        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">{item.description}</p>
                                    </div>
                                    {item.type === 'toggle' && (
                                        <button
                                            onClick={() => toggle(item.label)}
                                            className={cn(
                                                "relative size-10 md:size-11 rounded-full transition-all duration-300 flex items-center shrink-0",
                                                toggles[item.label] ? 'bg-primary' : 'bg-gray-200'
                                            )}
                                        >
                                            <div className={cn(
                                                "size-4 md:size-5 bg-white rounded-full shadow-md transition-transform duration-300",
                                                toggles[item.label] ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                                            )} />
                                        </button>
                                    )}
                                    {item.type === 'action' && (
                                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                                    )}
                                    {item.type === 'info' && (
                                        <span className="text-[11px] md:text-xs text-gray-400 font-medium shrink-0">{item.description}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
