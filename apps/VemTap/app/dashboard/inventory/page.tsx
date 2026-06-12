"use client";

import React from 'react';
import { 
    InventoryOverviewHeader, 
    InventoryStatsCards,
    InventoryRecentActivity
} from '@/components/dashboard/inventory/InventoryDashboard';
import { Package, AlertTriangle, XCircle, Wallet, Plus, ArrowRight } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InventoryPage() {
    const { inventoryLevels, stockLogs } = useInventoryStore();
    
    const stats = [
        { label: 'Total Units', value: Object.values(inventoryLevels).reduce((a, b) => a + b, 0).toLocaleString() || '12,450', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Low Stock', value: '18', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Out of Stock', value: '7', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Inv. Value', value: '₦4.2M', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const logs = stockLogs.slice(0, 5).map(log => ({
        ...log,
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: INVENTORY DASHBOARD */}
            
            <InventoryOverviewHeader />
            
            <InventoryStatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Activity & Quick Actions */}
                <div className="lg:col-span-2 space-y-8">
                    <InventoryRecentActivity logs={logs.length > 0 ? logs : [
                        { productName: 'Caramel Macchiato', action: 'remove', quantity: 2, reason: 'Sale', time: '10:45 AM' },
                        { productName: 'Blueberry Muffin', action: 'remove', quantity: 1, reason: 'Sale', time: '10:40 AM' },
                        { productName: 'Oat Milk', action: 'add', quantity: 10, reason: 'Restock', time: '09:00 AM' },
                    ]} />

                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/dashboard/inventory/manage" className="p-8 rounded-[40px] bg-gray-900 text-white shadow-xl flex items-center justify-between hover:bg-gray-800 transition-all">
                            <div>
                                <h3 className="text-xl font-black mb-2">Manage Stock</h3>
                                <p className="text-xs font-medium text-white/50">Adjust levels or restock.</p>
                            </div>
                            <ArrowRight />
                        </Link>
                        <Link href="/dashboard/inventory/alerts" className="p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm flex items-center justify-between hover:border-[#066CF4]/20 transition-all">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">Low Stock Alerts</h3>
                                <p className="text-xs font-medium text-gray-400">View critical shortages.</p>
                            </div>
                            <ArrowRight className="text-gray-300" />
                        </Link>
                    </div>
                </div>

                {/* RIGHT COLUMN: Performance */}
                <div className="lg:col-span-1 rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 mb-8">Stock Health</h3>
                    <div className="space-y-6">
                        <div className="h-4 bg-gray-100 rounded-full flex overflow-hidden">
                           <div className="h-full w-[70%] bg-emerald-500" />
                           <div className="h-full w-[20%] bg-amber-500" />
                           <div className="h-full w-[10%] bg-red-500" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <div className="text-center"><div className="size-3 bg-emerald-500 rounded-full mx-auto mb-2" /><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Healthy</p></div>
                           <div className="text-center"><div className="size-3 bg-amber-500 rounded-full mx-auto mb-2" /><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Low</p></div>
                           <div className="text-center"><div className="size-3 bg-red-500 rounded-full mx-auto mb-2" /><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Out</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
