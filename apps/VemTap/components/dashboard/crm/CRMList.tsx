'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Search, Filter, ChevronDown, Check,
    Download, LayoutGrid, Trash2, Send,
    MoreVertical, ArrowRight, User
} from 'lucide-react';
import { useCRMStore, SortOption } from '@/store/useCRMStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function CRMListHeader({ total }: { total: number }) {
    const { activeSort, setSort } = useCRMStore();

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">All Customers</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    {total.toLocaleString()} total records found
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search name, phone..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all"
                    />
                </div>
                <Button variant="outline" className="h-12 rounded-2xl border-gray-100 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest">
                    <Filter size={16} className="mr-2" />
                    Filter
                </Button>
            </div>
        </div>
    );
}

export function CRMCustomerCard({ customer }: { customer: any }) {
    const { selectedCustomerIds, toggleCustomerSelection } = useCRMStore();
    const isSelected = selectedCustomerIds.includes(customer.id);

    return (
        <div className={cn(
            "group relative p-6 rounded-[32px] bg-white border transition-all duration-300 active:scale-[0.98]",
            isSelected ? "border-[#066CF4] shadow-xl shadow-blue-500/5 bg-blue-50/10" : "border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5"
        )}>
            <div className="flex items-start gap-5">
                {/* Selection & Avatar */}
                <div className="relative">
                    <button 
                        onClick={() => toggleCustomerSelection(customer.id)}
                        className={cn(
                            "absolute -top-1 -left-1 z-10 size-6 rounded-lg flex items-center justify-center transition-all",
                            isSelected ? "bg-[#066CF4] text-white scale-110" : "bg-gray-100 text-transparent opacity-0 group-hover:opacity-100"
                        )}
                    >
                        <Check size={14} strokeWidth={4} />
                    </button>
                    <div className="size-16 rounded-[22px] bg-[#066CF4]/5 text-[#066CF4] flex items-center justify-center font-black text-xl italic shadow-sm overflow-hidden shrink-0">
                        {customer.logo ? <img src={customer.logo} className="size-full object-cover" /> : (customer.name?.[0] || 'C')}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-lg font-black text-gray-900 truncate">{customer.name || 'Anonymous'}</h3>
                        <Badge className={cn(
                            "border-none px-2.5 py-0.5 font-black text-[9px] uppercase tracking-wider",
                            customer.status === 'VIP' ? "bg-amber-100 text-amber-600" :
                            customer.status === 'New' ? "bg-blue-50 text-[#066CF4]" : "bg-emerald-50 text-emerald-600"
                        )}>
                            {customer.status || 'Active'}
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-bold text-gray-500">{customer.phone || 'No phone'}</p>
                        <p className="text-[10px] font-medium text-gray-400 truncate">{customer.email || 'No email'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Last Activity</span>
                    <span className="text-[11px] font-bold text-gray-700">{customer.lastActivity || '2 days ago'}</span>
                </div>
                <Link href={`/dashboard/visitors/${customer.id}`}>
                    <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-[#066CF4] hover:bg-blue-50">
                        Profile
                        <ArrowRight size={14} className="ml-1" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export function CRMBulkActions() {
    const { selectedCustomerIds, clearSelection } = useCRMStore();
    
    if (selectedCustomerIds.length === 0) return null;

    return (
        <motion.div 
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            className="fixed bottom-10 left-1/2 z-[100] flex items-center gap-4 p-3 bg-gray-900 text-white rounded-3xl shadow-2xl min-w-[320px] md:min-w-[480px]"
        >
            <div className="px-4 border-r border-white/10 shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected</p>
                <p className="text-lg font-black">{selectedCustomerIds.length}</p>
            </div>
            
            <div className="flex-1 flex justify-center gap-2 overflow-x-auto no-scrollbar px-2">
                {[
                    { label: 'Export', icon: Download, color: 'bg-white/10' },
                    { label: 'Segment', icon: LayoutGrid, color: 'bg-white/10' },
                    { label: 'Campaign', icon: Send, color: 'bg-[#066CF4]' },
                    { label: 'Delete', icon: Trash2, color: 'bg-red-500/20 text-red-400' },
                ].map((act) => (
                    <button key={act.label} className={cn("flex flex-col items-center gap-1.5 p-2 rounded-2xl min-w-[64px] transition-all active:scale-90", act.color)}>
                        <act.icon size={18} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{act.label}</span>
                    </button>
                ))}
            </div>

            <button 
                onClick={clearSelection}
                className="size-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all shrink-0 mr-1"
            >
                <MoreVertical size={20} />
            </button>
        </motion.div>
    );
}
