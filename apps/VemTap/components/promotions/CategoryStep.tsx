'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, Search as SearchIcon, Check, Loader2,
    ShoppingBag, Utensils, Sparkles, Stethoscope, Briefcase, Tv,
    GraduationCap, Home, Wrench, Truck, Building2, Music, Coins,
    Sprout, Factory, Heart, Landmark, MoreHorizontal, LucideIcon,
    AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/categories/hooks';
import { Category } from '@/services/categories';
import { SECTOR_CATEGORIES } from '@/lib/mock/promotions';
import { cn } from '@/lib/utils';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    'retail': ShoppingBag,
    'food': Utensils,
    'beauty': Sparkles,
    'health': Stethoscope,
    'professional services': Briefcase,
    'technology': Tv,
    'education': GraduationCap,
    'real estate': Home,
    'automotive': Wrench,
    'logistics': Truck,
    'construction': Building2,
    'events': Music,
    'finance': Coins,
    'agriculture': Sprout,
    'manufacturing': Factory,
    'religious': Heart,
    'government': Landmark,
};

function resolveIcon(name: string): LucideIcon {
    const key = name.toLowerCase();
    const match = Object.entries(CATEGORY_ICON_MAP).find(([k]) => key.includes(k));
    return match?.[1] || MoreHorizontal;
}

interface DropdownCategory {
    id: string;
    name: string;
    icon: LucideIcon;
}

interface CategoryDropdownProps {
    selected: string | null;
    onSelect: (categoryId: string | null) => void;
}

export default function CategoryDropdown({ selected, onSelect }: CategoryDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const PAGE_SIZE = 50;

    const { data: apiData, isLoading, isError } = useQuery({
        queryKey: ['categories', 'all-pages'],
        queryFn: async () => {
            // Fetch page 1 first
            const first = await getCategories({ page: 1, limit: PAGE_SIZE });
            const allItems: { id: string; name: string }[] = [...(first.items || [])];
            const totalPages = first.meta?.totalPages || 1;

            // Fetch remaining pages in parallel
            if (totalPages > 1) {
                const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
                const restResponses = await Promise.all(
                    remainingPages.map(page => getCategories({ page, limit: PAGE_SIZE }))
                );
                restResponses.forEach(r => {
                    if (r?.items) allItems.push(...r.items);
                });
            }

            return { items: allItems };
        },
        staleTime: 5 * 60 * 1000,
    });

    const categories: DropdownCategory[] = useMemo(() => {
        const raw: { id: string; name: string }[] = apiData?.items || SECTOR_CATEGORIES;
        return raw.map(c => ({ id: c.id, name: c.name, icon: resolveIcon(c.name) }));
    }, [apiData]);

    const filtered = search.trim()
        ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : categories;

    const selectedCat = selected ? categories.find(c => c.id === selected) : null;
    const SelectedIcon = selectedCat?.icon;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-13 flex items-center gap-3 px-4 bg-white border-2 rounded-xl text-left transition-all",
                    isOpen ? "border-primary ring-4 ring-primary/5" : "border-gray-200 hover:border-gray-300"
                )}
            >
                {SelectedIcon ? (
                    <div className="size-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <SelectedIcon size={16} className="text-gray-500" />
                    </div>
                ) : (
                    <div className="size-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                        <SearchIcon size={16} className="text-primary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                        {isLoading ? 'Loading...' : selectedCat?.name || 'All Categories'}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400">
                        {isLoading ? 'Fetching categories' : selected ? 'Filtering by category' : 'Browse all deals'}
                    </p>
                </div>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-gray-400 transition-transform duration-200 shrink-0",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-black/5 overflow-hidden"
                    >
                        {/* Search within dropdown */}
                        <div className="p-3 pb-0">
                            <div className="relative">
                                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search categories..."
                                    className="w-full h-10 pl-9 pr-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20"
                                />
                            </div>
                        </div>

                        <div className="p-2 max-h-72 overflow-y-auto">
                            {/* Loading state */}
                            {isLoading && (
                                <div className="flex items-center justify-center gap-2 py-8">
                                    <Loader2 size={14} className="animate-spin text-primary" />
                                    <span className="text-xs font-bold text-gray-400">Loading categories...</span>
                                </div>
                            )}

                            {/* Error state */}
                            {isError && (
                                <div className="flex items-center gap-2 py-8 px-3">
                                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                                    <span className="text-xs font-bold text-gray-400">Using default categories</span>
                                </div>
                            )}

                            {!isLoading && (
                                <>
                                    {/* All option */}
                                    <button
                                        onClick={() => { onSelect(null); setIsOpen(false); setSearch(''); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                                            !selected ? "bg-primary/5 text-primary" : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="size-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                            <SearchIcon size={16} className={!selected ? "text-primary" : "text-gray-400"} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">All Categories</p>
                                            <p className="text-[10px] text-gray-400">Show every deal</p>
                                        </div>
                                        {!selected && <Check size={16} className="text-primary" />}
                                    </button>

                                    <div className="h-px bg-gray-100 my-1 mx-3" />

                                    {/* Category options */}
                                    {filtered.map(cat => {
                                        const CatIcon = cat.icon;
                                        const isSelected = selected === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => { onSelect(cat.id); setIsOpen(false); setSearch(''); }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                                                    isSelected ? "bg-primary/5 text-primary" : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "size-9 rounded-lg flex items-center justify-center shrink-0",
                                                    isSelected ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-500"
                                                )}>
                                                    {CatIcon && <CatIcon size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn("text-sm font-bold", isSelected && "text-primary")}>
                                                        {cat.name}
                                                    </p>
                                                </div>
                                                {isSelected && <Check size={16} className="text-primary" />}
                                            </button>
                                        );
                                    })}

                                    {filtered.length === 0 && (
                                        <div className="py-8 text-center">
                                            <p className="text-xs text-gray-400 font-bold">No categories match &ldquo;{search}&rdquo;</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
