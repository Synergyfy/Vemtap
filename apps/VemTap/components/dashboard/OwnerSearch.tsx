'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSudoStore } from '@/store/useSudoStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useQueryClient } from '@tanstack/react-query';
import { OWNER_MENU_ITEMS, MenuItem } from '@/constants/ownerNavigation';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
import { Search, CornerDownLeft, Command, LogOut, Key, Plus, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UpgradeModal from './UpgradeModal';

interface SearchResult {
    type: 'page' | 'action';
    id: string;
    label: string;
    parentLabel?: string;
    href: string;
    icon: any;
    feature?: string;
    featureName?: string;
    keywords?: string[];
    actionType?: string;
}

export default function OwnerSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, featureName: '' });

    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;
    const { getLinkWithBranch } = useActiveBranch();
    const { isFeatureLocked } = useSubscriptionStore();
    const queryClient = useQueryClient();
    
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Filter and flatten authorized menu items
    const getAuthorizedPages = useCallback((): SearchResult[] => {
        const pages: SearchResult[] = [];
        const userPermissions = user?.permissions || [];
        const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());
        const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

        // Filter primary menu items first
        const filteredItems = OWNER_MENU_ITEMS.filter(item => {
            if (isAdminMode) {
                if (item.id === 'staff') return false;
                if (item.id === 'agent-desk') return false;
                if (item.id === 'admin-nfc') return false;
                return !item.roles || item.roles.includes('owner');
            }
            return canAccessMenuItem(item, realUserRole, userPermissions, isOwnerOrAdmin);
        });

        filteredItems.forEach(item => {
            if (item.submenu) {
                item.submenu.forEach(sub => {
                    pages.push({
                        type: 'page',
                        id: `${item.id}-${sub.label}`,
                        label: sub.label,
                        parentLabel: item.label,
                        href: sub.href,
                        icon: item.icon,
                        feature: sub.feature,
                        featureName: sub.featureName,
                        keywords: sub.keywords
                    });
                });
            } else if (item.href) {
                pages.push({
                    type: 'page',
                    id: item.id,
                    label: item.label,
                    href: item.href,
                    icon: item.icon,
                    feature: item.feature,
                    featureName: item.featureName,
                    keywords: item.keywords
                });
            }
        });

        return pages;
    }, [user, isAdminMode]);

    // Quick Actions list
    const getQuickActions = useCallback((): SearchResult[] => {
        const actions: SearchResult[] = [
            {
                type: 'action',
                id: 'action-logout',
                label: 'Logout Account Session',
                href: '#',
                icon: LogOut,
                keywords: ['signout', 'exit', 'quit', 'end'],
                actionType: 'logout'
            }
        ];

        // Add Impersonation Exit if active
        if (isAdminMode) {
            actions.unshift({
                type: 'action',
                id: 'action-exit-sudo',
                label: 'Exit Sudo / Impersonation Mode',
                href: '#',
                icon: Key,
                keywords: ['admin', 'sudo', 'exit', 'stop', 'back', 'unimpersonate'],
                actionType: 'exit-sudo'
            });
        }

        return actions;
    }, [isAdminMode]);

    // Filter results based on search query
    const getFilteredResults = (): SearchResult[] => {
        const allItems = [...getAuthorizedPages(), ...getQuickActions()];
        const cleanQuery = query.toLowerCase().trim();

        if (!cleanQuery) {
            // Default/popular items when query is empty
            return allItems.slice(0, 8);
        }

        return allItems.filter(item => {
            const matchesLabel = item.label.toLowerCase().includes(cleanQuery);
            const matchesParent = item.parentLabel?.toLowerCase().includes(cleanQuery) || false;
            const matchesKeywords = item.keywords?.some(kw => kw.toLowerCase().includes(cleanQuery)) || false;
            return matchesLabel || matchesParent || matchesKeywords;
        });
    };

    const filteredResults = getFilteredResults();

    // Toggle panel
    const openPalette = () => {
        setIsOpen(true);
        setQuery('');
        setSelectedIndex(0);
    };

    const closePalette = () => {
        setIsOpen(false);
    };

    // Trigger shortcut Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ensure we only trigger if not in input/textarea (unless it's ctrl+k itself)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) closePalette();
                else openPalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Close on route change
    useEffect(() => {
        closePalette();
    }, [pathname]);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Auto-scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const container = resultsRef.current;
            const selectedElement = container.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.clientHeight;
                const elemTop = selectedElement.offsetTop;
                const elemBottom = elemTop + selectedElement.clientHeight;

                if (elemTop < containerTop) {
                    container.scrollTop = elemTop;
                } else if (elemBottom > containerBottom) {
                    container.scrollTop = elemBottom - container.clientHeight;
                }
            }
        }
    }, [selectedIndex]);

    // Handle selection execution
    const handleSelect = (item: SearchResult) => {
        // Subscription check for locked premium features
        if (item.feature && isFeatureLocked(item.feature)) {
            setUpgradeModal({
                isOpen: true,
                featureName: item.featureName || item.label
            });
            return;
        }

        closePalette();

        if (item.type === 'action') {
            if (item.actionType === 'logout') {
                queryClient.clear();
                if (typeof window !== 'undefined') {
                    localStorage.clear();
                }
                logout();
                router.push('/login');
            } else if (item.actionType === 'exit-sudo') {
                // Exit impersonation mode by reloading to the admin dashboard
                if (typeof window !== 'undefined') {
                    window.location.href = '/admin/dashboard';
                }
            }
        } else {
            // Respect Branch context wrapping
            router.push(getLinkWithBranch(item.href));
        }
    };

    // Keyboard controls within input
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredResults[selectedIndex]) {
                handleSelect(filteredResults[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closePalette();
        }
    };

    // Matching Text Highlight Utility
    const highlightText = (text: string, searchStr: string) => {
        if (!searchStr.trim()) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
        return (
            <span>
                {parts.map((part, index) => 
                    part.toLowerCase() === searchStr.toLowerCase() ? (
                        <mark key={index} className="bg-primary/20 text-primary font-semibold px-0.5 rounded-[2px]">{part}</mark>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <>
            {/* Header Trigger Button */}
            <div className="relative max-w-sm w-full hidden sm:block">
                <button
                    onClick={openPalette}
                    className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-650 hover:border-gray-300 hover:bg-white text-left transition-all flex items-center justify-between cursor-pointer shadow-xs"
                >
                    <div className="flex items-center gap-2">
                        <Search className="text-gray-400 shrink-0" size={18} />
                        <span>Search features, pages, actions...</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1.5 py-0.5 text-[10px] font-black text-gray-400 shadow-xs shrink-0">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </button>
            </div>

            {/* Mobile/Tablet Trigger Icon */}
            <button
                onClick={openPalette}
                className="p-2 text-text-secondary hover:text-text-main hover:bg-gray-50 rounded-lg sm:hidden transition-colors"
                aria-label="Search dashboard"
            >
                <Search size={20} />
            </button>

            {/* Command Palette Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-100 flex items-start justify-center pt-20 px-4 md:pt-32">
                        {/* Backdrop Blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={closePalette}
                        />

                        {/* Search Card */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-150 flex flex-col overflow-hidden max-h-[480px]"
                        >
                            {/* Input Bar */}
                            <div className="flex items-center h-14 border-b border-gray-150 px-4 gap-3 bg-gray-50/50">
                                <Search className="text-gray-400 shrink-0" size={20} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search dashboard features, pages, actions..."
                                    className="flex-1 h-full bg-transparent border-0 text-sm text-text-main focus:outline-none placeholder-gray-400 font-medium"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                    onKeyDown={handleInputKeyDown}
                                />
                                {query && (
                                    <button 
                                        onClick={() => setQuery('')} 
                                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-650 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="text-[10px] font-bold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 bg-white shadow-xs">
                                    ESC
                                </div>
                            </div>

                            {/* Results Panel */}
                            <div 
                                ref={resultsRef}
                                className="flex-1 overflow-y-auto py-2 max-h-[360px] divide-y divide-gray-50"
                            >
                                {filteredResults.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                            <Search className="text-gray-400" size={20} />
                                        </div>
                                        <p className="text-sm font-bold text-text-main">Couldn't find what you're looking for? Try a different search term.</p>
                                        <p className="text-xs text-text-secondary mt-1">We couldn't find anything matching "{query}"</p>
                                    </div>
                                ) : (
                                    filteredResults.map((item, idx) => {
                                        const IconComponent = item.icon;
                                        const isSelected = idx === selectedIndex;
                                        const isLocked = item.feature && isFeatureLocked(item.feature);

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelect(item)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-primary/5 text-primary' : 'bg-transparent text-text-secondary hover:text-text-main'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className={`p-2 rounded-xl border transition-colors shrink-0 ${
                                                        isSelected ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-gray-50 border-gray-200 text-gray-400'
                                                    }`}>
                                                        <IconComponent size={18} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {item.parentLabel && (
                                                                <span className="text-xs font-semibold text-gray-400 shrink-0">
                                                                    {item.parentLabel}
                                                                </span>
                                                            )}
                                                            {item.parentLabel && (
                                                                <span className="text-[10px] text-gray-300 font-bold shrink-0">/</span>
                                                            )}
                                                            <span className={`text-sm ${isSelected ? 'font-bold text-primary' : 'font-medium text-text-main'} truncate`}>
                                                                {highlightText(item.label, query)}
                                                            </span>
                                                            {isLocked && (
                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[8px] font-black uppercase text-amber-600 shadow-xs shrink-0 select-none">
                                                                    <Lock size={8} className="fill-amber-600" />
                                                                    <span>PRO</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                            {item.type === 'action' ? 'Quick System Action' : `Route: ${item.href}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                                    {item.type === 'action' ? (
                                                        <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-50 border border-amber-250 text-amber-600 px-2 py-0.5 rounded-full shadow-xs">
                                                            Action
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold tracking-wider uppercase bg-primary/5 border border-primary/10 text-primary px-2 py-0.5 rounded-full shadow-xs">
                                                            Page
                                                        </span>
                                                    )}
                                                    
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -5 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="flex items-center text-primary"
                                                        >
                                                            <CornerDownLeft size={14} className="stroke-[2.5px]" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Help Footer */}
                            <div className="h-10 border-t border-gray-150 bg-gray-50 flex items-center justify-between px-5 text-[10px] text-gray-400 shrink-0 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <kbd className="bg-white px-1.5 py-0.5 border border-gray-200 rounded shadow-xs font-mono font-bold">↑↓</kbd>
                                        <span>to navigate</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd className="bg-white px-1.5 py-0.5 border border-gray-200 rounded shadow-xs font-mono font-bold">↵</kbd>
                                        <span>to select</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 font-medium">
                                    <span>VemTap Control Tower</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Upgrade Modal trigger */}
            <UpgradeModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                featureName={upgradeModal.featureName}
            />
        </>
    );
}
