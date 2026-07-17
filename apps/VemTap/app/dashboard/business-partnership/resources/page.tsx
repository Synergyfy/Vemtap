'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Presentation, CheckCircle, Target, TrendingUp, Award, Handshake, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
    {
        title: 'What is the Business Partnership Program?',
        content: 'The VEMTAP Business Partnership program allows you to earn rewards by referring other businesses to join VEMTAP. When a business you refer signs up and subscribes, you earn a commission based on their subscription tier. The more businesses you refer, the more you earn and the higher your partner level.'
    },
    {
        title: 'How It Works',
        items: [
            { icon: Handshake, text: 'Share your unique referral link or QR code with businesses in your network' },
            { icon: Users, text: 'When a business signs up through your link, they are linked to your partnership account' },
            { icon: TrendingUp, text: 'You earn monthly commission as long as the referred business remains an active subscriber' },
            { icon: Award, text: 'Climb partner levels (Silver → Gold → Platinum → Diamond → Elite) for higher commission rates' },
        ]
    },
    {
        title: 'Commission Tiers',
        content: 'Partner LevelCommission RateRequirementSilver Partner5%Refer 5 businessesGold Partner8%Refer 15 businessesPlatinum Partner12%Refer 30 businessesDiamond Partner15% + Priority SupportRefer 50 businessesElite Partner20% + Exclusive RewardsRefer 100 businesses'
    },
    {
        title: 'Key Benefits',
        items: [
            { icon: TrendingUp, text: 'Recurring monthly commission on every active referred business' },
            { icon: Target, text: 'Performance bonuses and milestone rewards as you grow' },
            { icon: Award, text: 'Exclusive partner badges, priority support, and premium features at higher tiers' },
            { icon: CheckCircle, text: 'Full transparency with real-time analytics and earnings tracking' },
        ]
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
};

export default function PartnershipResourcesPage() {
    const [expandedSection, setExpandedSection] = useState<number>(0);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8">

            {/* Presentations */}
            <div>
                <div className="flex items-center gap-2.5 mb-4 md:mb-5">
                    <div className="size-9 md:size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Presentation size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm md:text-lg font-semibold text-gray-900">Program Overview</h2>
                        <p className="text-[11px] md:text-xs text-gray-500">Everything you need to know about the Business Partnership program</p>
                    </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                    {sections.map((section, i) => {
                        const isOpen = expandedSection === i;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-sm"
                            >
                                <button
                                    onClick={() => setExpandedSection(isOpen ? -1 : i)}
                                    className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-gray-50/50 transition-colors"
                                >
                                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 pr-4">{section.title}</h3>
                                    <ChevronDown size={16} className={cn('shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
                                </button>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 border-t border-gray-50">
                                                {section.content && (
                                                    <div className="mt-3 text-xs md:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                                        {section.content}
                                                    </div>
                                                )}
                                                {section.items && (
                                                    <div className="mt-3 space-y-2.5">
                                                        {section.items.map((item, ii) => {
                                                            const Icon = item.icon;
                                                            return (
                                                                <div key={ii} className="flex items-start gap-3">
                                                                    <div className="size-7 md:size-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                                                                        <Icon size={14} className="text-primary" />
                                                                    </div>
                                                                    <span className="text-[11px] md:text-xs text-gray-600">{item.text}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
