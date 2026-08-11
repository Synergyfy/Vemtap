'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ADMIN_MENU_ITEMS, MenuItem, SubmenuItem } from '@/constants/adminNavigation';
import { Search, CornerDownLeft, Command, Plus, LogOut, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
    type: 'page' | 'action';
    id: string;
    label: string;
    parentLabel?: string;
    href: string;
    icon: any;
    keywords?: string[];
    actionType?: string;
}

export default function AdminSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Flatten authorized menu items
    const getAuthorizedPages = useCallback((): SearchResult[] => {
        const pages: SearchResult[] = [];

        ADMIN_MENU_ITEMS.forEach(item => {
            // Permission check
            const hasPermission = (() => {
                if (user?.role?.toLowerCase() === 'admin' && (!user.permissions || user.permissions.length === 0)) return true;
                if (user?.permissions?.includes('admin:all')) return true;
                if (!item.permission) return true;
                return user?.permissions?.includes(item.permission);
            })();

            if (!hasPermission) return;

            if (item.submenu) {
                item.submenu.forEach(sub => {
                    pages.push({
                        type: 'page',
                        id: `${item.id}-${sub.label}`,
                        label: sub.label,
                        parentLabel: item.label,
                        href: sub.href,
                        icon: item.icon,
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
                    keywords: item.keywords
                });
            }
        });

        return pages;
    }, [user]);

    // Quick Actions list
    const getQuickActions = useCallback((): SearchResult[] => {
        const actions: SearchResult[] = [
            {
                type: 'action',
                id: 'action-logout',
                label: 'Logout Administrator Session',
                href: '#',
                icon: LogOut,
                keywords: ['signout', 'exit', 'quit', 'end'],
                actionType: 'logout'
            }
        ];

        // Add Product check
        const canAddProduct = (() => {
            if (user?.role?.toLowerCase() === 'admin' && (!user.permissions || user.permissions.length === 0)) return true;
            if (user?.permissions?.includes('admin:all') || user?.permissions?.includes('admin:products')) return true;
            return false;
        })();

        if (canAddProduct) {
            actions.unshift({
                type: 'action',
                id: 'action-add-product',
                label: 'Add New Hardware Product',
                href: '/admin/products/create',
                icon: Plus,
                keywords: ['create', 'new', 'store', 'hardware', 'add'],
                actionType: 'navigate'
            });
        }

        // Add System Health check
        const canCheckHealth = (() => {
            if (user?.role?.toLowerCase() === 'admin' && (!user.permissions || user.permissions.length === 0)) return true;
            if (user?.permissions?.includes('admin:all') || user?.permissions?.includes('admin:health')) return true;
            return false;
        })();

        if (canCheckHealth) {
            actions.unshift({
                type: 'action',
                id: 'action-system-health',
                label: 'Diagnose System Health',
                href: '/admin/health',
                icon: Activity,
                keywords: ['status', 'uptime', 'cpu', 'servers', 'logs', 'check'],
                actionType: 'navigate'
            });
        }

        return actions;
    }, [user]);

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
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) closePalette();
                else openPalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

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
        closePalette();
        if (item.type === 'action' && item.actionType === 'logout') {
            logout().then(() => router.push('/login'));
        } else {
            router.push(item.href);
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
            {/* Header Trigger Button (Matches the original design perfectly with premium additions) */}
            <div className="relative max-w-md w-full hidden sm:block">
                <button
                    onClick={openPalette}
                    className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-white text-left transition-all flex items-center justify-between cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <Search className="text-gray-400 shrink-0" size={18} />
                        <span>Search features, actions, tools...</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-400 shadow-sm shrink-0">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </button>
            </div>

            {/* Mobile Trigger Icon */}
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
                                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="text-[10px] font-bold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 bg-white shadow-sm">
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

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelect(item)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-primary/5 text-primary' : 'bg-transparent text-text-secondary hover:text-text-main'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`p-2 rounded-xl border transition-colors shrink-0 ${
                                                        isSelected ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-gray-50 border-gray-200 text-gray-400'
                                                    }`}>
                                                        <IconComponent size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
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
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                            {item.type === 'action' ? 'Quick System Action' : `Route: ${item.href}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {item.type === 'action' ? (
                                                        <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-50 border border-amber-250 text-amber-600 px-2 py-0.5 rounded-full shadow-sm">
                                                            Action
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold tracking-wider uppercase bg-primary/5 border border-primary/10 text-primary px-2 py-0.5 rounded-full shadow-sm">
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
        </>
    );
}
