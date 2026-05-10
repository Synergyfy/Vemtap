"use client";

import React, { useState, useMemo } from 'react';
import { Search, Check, X, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMessagingVisitorsByBranch } from '@/services/visitors/hooks';
import { Visitor } from '@/services/visitors/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CustomerSelectorProps {
    selectedIds: string[];
    onSelect: (ids: string[]) => void;
}

export default function CustomerSelector({ selectedIds, onSelect }: CustomerSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: visitors = [], isLoading } = useMessagingVisitorsByBranch();

    const filteredVisitors = useMemo(() => {
        if (!searchQuery.trim()) return visitors.slice(0, 10); // Show first 10 if no search
        const query = searchQuery.toLowerCase();
        return visitors.filter(v => 
            v.name?.toLowerCase().includes(query) || 
            (v.firstName && v.firstName.toLowerCase().includes(query)) ||
            (v.lastName && v.lastName.toLowerCase().includes(query)) ||
            v.phone?.toLowerCase().includes(query) ||
            v.email?.toLowerCase().includes(query)
        ).slice(0, 20); // Limit results for performance
    }, [visitors, searchQuery]);

    const toggleVisitor = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelect(selectedIds.filter(i => i !== id));
        } else {
            onSelect([...selectedIds, id]);
        }
    };

    const selectedVisitors = visitors.filter(v => selectedIds.includes(v.id));

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                    placeholder="Search by name, phone or email..." 
                    className="pl-11 h-12 rounded-2xl border-gray-100 bg-white shadow-sm focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} />
                        {isLoading ? 'Loading Customers...' : 'Select Customers'}
                    </h4>
                    <div className="flex items-center gap-4">
                        {!isLoading && visitors.length > 0 && (
                            <button 
                                type="button"
                                onClick={() => {
                                    if (selectedIds.length === visitors.length) {
                                        onSelect([]);
                                    } else {
                                        onSelect(visitors.map(v => v.id));
                                    }
                                }}
                                className="text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors"
                            >
                                {selectedIds.length === visitors.length ? 'Deselect All' : `Select All (${visitors.length})`}
                            </button>
                        )}
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {selectedIds.length} Selected
                        </span>
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-10 text-center text-gray-400 animate-pulse">Fetching visitors...</div>
                    ) : filteredVisitors.length > 0 ? (
                        filteredVisitors.map((visitor) => {
                            const isSelected = selectedIds.includes(visitor.id);
                            return (
                                <button
                                    key={visitor.id}
                                    onClick={() => toggleVisitor(visitor.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                                        isSelected 
                                            ? 'bg-primary/5 text-primary border border-primary/10' 
                                            : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-xs ${
                                            isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {visitor.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{visitor.name}</p>
                                            <p className="text-[10px] opacity-60 font-medium">{visitor.phone || visitor.email || 'No contact info'}</p>
                                        </div>
                                    </div>
                                    {isSelected && <Check size={18} className="text-primary" />}
                                </button>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center text-gray-400">
                            No customers found for "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Tags */}
            <AnimatePresence>
                {selectedVisitors.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-wrap gap-2 pt-2"
                    >
                        {selectedVisitors.map(v => (
                            <span 
                                key={v.id} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full shadow-sm"
                            >
                                {v.name}
                                <button onClick={() => toggleVisitor(v.id)} className="hover:text-white/80">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 text-xs font-bold hover:text-red-500"
                            onClick={() => onSelect([])}
                        >
                            Clear All
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
