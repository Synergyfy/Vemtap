"use client";

import React from 'react';
import { 
    OrdersOverviewHeader, 
    OrderStatusCards, 
    OrderListCard 
} from '@/components/dashboard/catalogue/OrdersDashboard';
import { useCatalogueOrders } from '@/services/catalogue/hooks';
import { ClipboardList, Clock, CheckCircle2, XCircle, Activity, ShoppingBag } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
    const { data: ordersData, isLoading } = useCatalogueOrders();
    const orders = (ordersData as any)?.data || [];

    const stats = [
        { label: 'Total Orders', value: '1,240', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending', value: '8', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Completed', value: '1,120', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Cancelled', value: '12', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Today', value: '45', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const mockOrders = [
        { id: '1', ref: 'VMP-88241', customerName: 'Sarah Jenkins', date: 'Today', time: '10:45 AM', items: '2x Caramel Macchiato, 1x Blueberry Muffin', status: 'Pending' },
        { id: '2', ref: 'VMP-88235', customerName: 'Michael K.', date: 'Today', time: '09:20 AM', items: '1x Premium Haircut, 1x Styling Gel', status: 'Confirmed' },
        { id: '3', ref: 'VMP-88212', customerName: 'Elena Rodriguez', date: 'Yesterday', time: '08:15 PM', items: '3x Flat White, 2x Avocado Toast', status: 'Completed' },
        { id: '4', ref: 'VMP-88190', customerName: 'David Wilson', date: 'Oct 24', time: '04:30 PM', items: '1x Deluxe Spa Day', status: 'Processing' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 5: ORDERS DASHBOARD */}
            
            <OrdersOverviewHeader />

            {/* STATUS CARDS */}
            <OrderStatusCards stats={stats} />

            {/* ORDERS LIST */}
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Active Requests</h3>
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                        {['All', 'Pending', 'Active'].map(f => (
                            <button key={f} className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                f === 'All' ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}>{f}</button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {(orders.length > 0 ? orders : mockOrders).map((order: any) => (
                        <OrderListCard key={order.id} order={order} />
                    ))}
                </div>

                {/* EMPTY STATE MOCK IF NEEDED */}
                {orders.length === 0 && mockOrders.length === 0 && (
                   <div className="py-32 text-center bg-white rounded-[48px] border border-dashed border-gray-200">
                      <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                         <ClipboardList size={40} />
                      </div>
                      <h4 className="text-lg font-black text-gray-900 mb-2">No orders found</h4>
                      <p className="text-sm font-medium text-gray-400">Share your ordering QR code to start receiving requests.</p>
                   </div>
                )}
            </div>

            <div className="mt-12 flex justify-center">
                <Button variant="outline" className="h-14 px-10 rounded-2xl border-gray-100 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-[#066CF4] hover:bg-blue-50 transition-all">
                    Load Older Orders
                </Button>
            </div>
        </div>
    );
}
