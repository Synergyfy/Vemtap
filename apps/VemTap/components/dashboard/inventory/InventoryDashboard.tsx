'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Package, AlertTriangle, XCircle, Wallet, 
    RefreshCw, Bell, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InventoryOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Inventory</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Track and manage stock levels across your business.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Bell size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-[#066CF4] rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <HelpCircle size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function InventoryStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[140px] md:min-w-0 rounded-[24px] md:rounded-[32px] bg-white p-5 md:p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className={cn("size-10 md:size-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm", stat.bg)}>
                        <stat.icon size={20} className={stat.color} />
                    </div>
                    <div className="text-xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function InventoryRecentActivity({ logs }: { logs: any[] }) {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8">Recent Activity</h3>
            
            <div className="space-y-4">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            {log.action === 'add' ? <RefreshCw className="text-emerald-500" size={18} /> : <RefreshCw className="text-red-500" size={18} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-black text-gray-900">{log.productName}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.reason}</p>
                        </div>
                        <div className="text-right">
                            <p className={cn("text-xs font-black", log.action === 'add' ? "text-emerald-500" : "text-red-500")}>
                                {log.action === 'add' ? '+' : '-'}{log.quantity}
                            </p>
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{log.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
