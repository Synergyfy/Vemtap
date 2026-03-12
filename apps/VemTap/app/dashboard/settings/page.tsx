'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import Link from 'next/link';
import { Store, Bell, Users, Puzzle, MessageSquare, Shield, ArrowRight, Star } from 'lucide-react';
import LogoIcon from '@/components/brand/LogoIcon';
import { useAuthStore } from '@/store/useAuthStore';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const isOwner = user?.role?.toLowerCase() === 'owner';

    const settingsCategories = [
        { title: 'Business Profile', desc: 'Manage your business information and layout', icon: Store, href: '/dashboard/settings/profile' },
        { title: 'Notifications', desc: 'Configure how you receive alerts and reports', icon: Bell, href: '/dashboard/settings/notifications' },
        { title: 'Device Settings', desc: 'Configure NFC device defaults and behaviors', icon: LogoIcon, href: '/dashboard/settings/devices' },
        { title: 'Team Management', desc: 'Invite staff and manage permissions', icon: Users, href: '/dashboard/staff', ownerOnly: true },
        { title: 'Integrations', desc: 'Connect with POS and CRM tools', icon: Puzzle, href: '/dashboard/settings/integrations' },
        { title: 'Message Settings', desc: 'Customize welcome and success messages', icon: MessageSquare, href: '/dashboard/settings/messages' },
        { title: 'Engagement', desc: 'User experience, forms, and response workflows', icon: Star, href: '/dashboard/settings/engagement/experience' },
        { title: 'Data & Privacy', desc: 'Manage data retention and compliance', icon: Shield, href: '/dashboard/settings/privacy' },
    ];

    const filteredCategories = settingsCategories.filter(item =>
        !item.ownerOnly || isOwner
    );

    return (
        <div className="p-8">
            <PageHeader
                title="Settings"
                description="Configure and manage your VemTap account preferences"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((item, i) => (
                    <Link
                        key={i}
                        href={item.href}
                        className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary/20 transition-all group overflow-hidden relative"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-primary text-primary group-hover:text-white transition-all shadow-sm">
                            <item.icon size={24} />
                        </div>
                        <h3 className="text-lg font-display font-bold text-text-main mb-1 tracking-tight">{item.title}</h3>
                        <p className="text-sm text-text-secondary font-medium leading-relaxed">{item.desc}</p>
                        <div className="mt-4 flex items-center text-primary text-xs font-black uppercase tracking-widest gap-1 group-hover:gap-2 transition-all">
                            Manage
                            <ArrowRight size={14} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
