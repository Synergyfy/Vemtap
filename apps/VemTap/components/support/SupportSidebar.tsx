'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Ticket,
    BookOpen,
    Tags,
    MessageSquare,
    Zap,
    MessageCircle,
    BarChart3,
    Users
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Support Tickets', href: '/dashboard/support/tickets', icon: Ticket },
    { name: 'Knowledge Base', href: '/dashboard/support/kb', icon: BookOpen },
    { name: 'Ticket Categories', href: '/dashboard/support', icon: Tags }, // Root goes to categories as in template
    { name: 'Canned Responses', href: '/dashboard/support/responses', icon: MessageSquare },
    { name: 'Automation Rules', href: '/dashboard/support/automations', icon: Zap },
    { name: 'Customer Feedback', href: '/dashboard/support/feedback', icon: MessageCircle },
    { name: 'Analytics & Reports', href: '/dashboard/support/analytics', icon: BarChart3 },
    { name: 'Agent Management', href: '/dashboard/support/agents', icon: Users }
];

export default function SupportSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-gray-200 bg-white h-[calc(100vh-(--spacing(16)))] sm:h-screen hidden md:block overflow-y-auto">
            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    // Consider exact match for the root, partial for others if needed
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-[14px] font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-amber-100/50 text-amber-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <Icon 
                                size={20} 
                                className={`mr-3 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} 
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
