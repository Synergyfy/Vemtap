'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TaskLink } from '@/lib/constants/controlTowerActions';

type TaskLinkGridProps = {
    title: string;
    subtitle: string;
    links: TaskLink[];
};

export default function TaskLinkGrid({ title, subtitle, links }: TaskLinkGridProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-display font-bold text-text-main">{title}</h2>
            <p className="text-xs text-text-secondary font-medium mt-1 mb-4">{subtitle}</p>
            <div className="space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                        <div>
                            <p className="text-sm font-bold text-text-main">{link.label}</p>
                            <p className="text-xs text-text-secondary">{link.description}</p>
                        </div>
                        <ArrowRight size={16} className="text-primary" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
