'use client';

import Link from 'next/link';

type EngagementTab = {
    label: string;
    href?: string;
    active?: boolean;
};

interface EngagementTabsProps {
    tabs: EngagementTab[];
}

export default function EngagementTabs({ tabs }: EngagementTabsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {tabs.map((tab) =>
                tab.active || !tab.href ? (
                    <span
                        key={tab.label}
                        className="px-4 h-11 rounded-xl bg-primary text-white text-sm font-black flex items-center shadow-lg shadow-primary/20"
                    >
                        {tab.label}
                    </span>
                ) : (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        className="px-4 h-11 rounded-xl bg-white border border-blue-200 text-sm font-black text-primary flex items-center hover:bg-blue-50 transition-colors"
                    >
                        {tab.label}
                    </Link>
                )
            )}
        </div>
    );
}
