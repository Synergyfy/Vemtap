"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
    label: string;
    href: string;
    icon?: React.ReactNode;
}

interface LoyaltyTabsProps {
    tabs: Tab[];
}

export default function LoyaltyTabs({ tabs }: LoyaltyTabsProps) {
    const pathname = usePathname();

    return (
        <div className="grid grid-cols-2 md:flex md:items-center gap-1 p-1 bg-gray-100/50 rounded-2xl w-full md:w-fit overflow-hidden">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "relative flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2.5 text-[11px] md:text-sm font-bold transition-all duration-300 rounded-xl whitespace-nowrap last:col-span-2 md:last:col-span-1",
                            isActive ? "text-primary" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                        )}
                    >
                        <span className="shrink-0">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white shadow-sm border border-gray-100 rounded-xl -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
