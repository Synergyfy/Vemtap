'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ChevronDown, X, Search, LogOut, User, Settings as SettingsIcon, ArrowRight
} from 'lucide-react';
import { NAVIGATION_SECTIONS } from '@/constants/ownerNavigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSudoStore } from '@/store/useSudoStore';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { MenuItem } from '@/constants/ownerNavigation';

interface DashboardMobileMoreSheetProps {
    open: boolean;
    onClose: () => void;
}

// These modules are already reachable from the bottom icon tabs, so the
// "More" panel shows everything else.
const BOTTOM_TAB_HREFS = [
    '/dashboard',
    '/dashboard/visitors',
    '/dashboard/commerce',
    '/dashboard/messaging/chat',
];

export default function DashboardMobileMoreSheet({ open, onClose }: DashboardMobileMoreSheetProps) {
    const router = useRouter();
    const { getLinkWithBranch } = useActiveBranch();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<string[]>([]);
    const userPermissions = useMemo(() => user?.permissions || [], [user]);
    const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());

    const go = (href: string) => {
        onClose();
        router.push(getLinkWithBranch(href));
    };

    const handleLogout = async () => {
        onClose();
        await logout();
        router.push('/login');
    };

    const toggle = (id: string) =>
        setExpanded(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

    const sections = useMemo(() => {
        const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

        return NAVIGATION_SECTIONS.map(section => ({
            ...section,
            items: section.items.filter(item => {
                if (BOTTOM_TAB_HREFS.includes(item.href || '')) return false;

                if (isAdminMode) {
                    if (['staff', 'agent-desk', 'admin-nfc'].includes(item.id)) return false;
                    return !item.roles || item.roles.includes('owner');
                }

                if (searchQuery) {
                    const match =
                        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        item.submenu?.some(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (!match) return false;
                }

                return canAccessMenuItem(item, realUserRole, userPermissions, isOwnerOrAdmin);
            }),
        })).filter(section => section.items.length > 0);
    }, [searchQuery, isAdminMode, user?.role, userPermissions, isOwnerOrAdmin]);

    const filteredSubmenu = (item: MenuItem) => {
        const subs = item.submenu || [];
        return subs.filter((sub, idx) => {
            if (isOwnerOrAdmin) return true;
            const subKey = `${item.permission}:${sub.label.toLowerCase().replace(/\s+/g, '-')}`;
            if (userPermissions.includes(subKey)) return true;
            if (userPermissions.includes(item.permission!) && idx === 0) return true;
            return false;
        });
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[380] bg-black/50 lg:hidden backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                        className="fixed bottom-0 inset-x-0 z-[381] lg:hidden bg-white rounded-t-3xl flex flex-col max-h-[85vh] overflow-hidden shadow-[0_-12px_40px_rgb(0,0,0,0.14)]"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1.5 rounded-full bg-gray-200" />
                        </div>

                        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-gray-100">
                            <h3 className="text-base font-bold text-text-main">More</h3>
                            <button
                                onClick={onClose}
                                className="size-8 -mr-1 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-5 pt-3 shrink-0">
                            <div className="relative">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search modules..."
                                    className="w-full h-11 bg-gray-50 border border-transparent rounded-xl pl-10 pr-4 text-sm font-medium focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                            {sections.map(section => (
                                <div key={section.id} className="mb-5 last:mb-0">
                                    {section.label && (
                                        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                                            {section.label}
                                        </p>
                                    )}
                                    <div className="space-y-1">
                                        {section.items.map(item => {
                                            const Icon = item.icon;
                                            const isExpanded = expanded.includes(item.id);

                                            return (
                                                <div key={item.id}>
                                                    <button
                                                        onClick={() => (item.submenu?.length ? toggle(item.id) : go(item.href || '/dashboard'))}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        <span className="size-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                                                            {Icon ? <Icon size={18} /> : <ArrowRight size={16} />}
                                                        </span>
                                                        <span className="flex-1 min-w-0 text-sm font-semibold text-text-main truncate">
                                                            {item.label}
                                                        </span>
                                                        {item.submenu?.length ? (
                                                            <ChevronDown
                                                                size={16}
                                                                className={`shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                            />
                                                        ) : null}
                                                    </button>
                                                    {item.submenu && item.submenu.length > 0 && isExpanded && (
                                                        <div className="ml-[3.25rem] pl-3 border-l border-gray-100 space-y-0.5 pt-1 pb-1.5">
                                                            {filteredSubmenu(item).map((sub, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => go(sub.href)}
                                                                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors cursor-pointer"
                                                                >
                                                                    {sub.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {sections.length === 0 && (
                                <div className="py-10 text-center text-sm text-gray-400">
                                    No modules match your search.
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 border-t border-gray-100 p-3 space-y-2 bg-white">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => go('/dashboard/settings/profile')}
                                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-50 text-sm font-semibold text-text-main hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <User size={15} /> Profile
                                </button>
                                <button
                                    onClick={() => go('/dashboard/settings')}
                                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-50 text-sm font-semibold text-text-main hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <SettingsIcon size={15} /> Settings
                                </button>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}