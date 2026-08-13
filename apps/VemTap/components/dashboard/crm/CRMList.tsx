'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Search, Filter, Check,
    Download, LayoutGrid, Trash2, Send,
    MoreVertical, ArrowRight
} from 'lucide-react';
import { useCRMStore } from '@/store/useCRMStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function CRMListHeader({ total }: { total: number }) {

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight tracking-tight">All Customers</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {total.toLocaleString()} total records found
                </p>
            </div>
            
            <div className="flex items-center gap-2.5">
                <div className="relative flex-1 md:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search name, phone..."
                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-medium text-sm transition-all"
                    />
                </div>
                <Button variant="outline" className="h-10 rounded-xl border-gray-100 bg-white shadow-sm font-semibold text-xs text-gray-600">
                    <Filter size={15} className="mr-2 text-gray-400" />
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
            "group relative p-5 rounded-2xl bg-white border transition-all duration-300 active:scale-[0.98]",
            isSelected ? "border-[#066CF4] shadow-md shadow-blue-500/5 bg-blue-50/10" : "border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-md"
        )}>
            <div className="flex items-start gap-4">
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
                    <div className="size-12 rounded-xl bg-[#066CF4]/5 text-[#066CF4] flex items-center justify-center font-bold text-lg italic shadow-sm overflow-hidden shrink-0">
                        {customer.logo ? <img src={customer.logo} className="size-full object-cover" /> : (customer.name?.[0] || 'C')}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 truncate">{customer.name || 'Anonymous'}</h3>
                        <Badge className={cn(
                            "border-none px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider",
                            customer.status === 'VIP' ? "bg-amber-100 text-amber-600" :
                            customer.status === 'New' ? "bg-blue-50 text-[#066CF4]" : "bg-emerald-50 text-emerald-600"
                        )}>
                            {customer.status || 'Active'}
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-500">{customer.phone || 'No phone'}</p>
                        <p className="text-xs text-gray-400 truncate">{customer.email || 'No email'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Last Activity</span>
                    <span className="text-xs font-semibold text-gray-700 mt-0.5">{customer.lastActivity || '2 days ago'}</span>
                </div>
                <Link href={`/dashboard/visitors/${customer.id}`}>
                    <Button variant="ghost" size="sm" className="rounded-lg text-xs font-semibold text-[#066CF4] hover:bg-blue-50">
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
