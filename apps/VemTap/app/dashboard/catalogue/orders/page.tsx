"use client";

import React, { useState } from 'react';
import { 
    OrdersOverviewHeader, 
    OrderStatusCards, 
    OrderListCard 
} from '@/components/dashboard/catalogue/OrdersDashboard';
import { useCatalogueOrders, useBusinessClaims } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { ClipboardList, Clock, CheckCircle2, XCircle, ShoppingBag, Gift, Tag, User, CalendarDays } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
    const { activeBranchId } = useActiveBranch();
    const [activeTab, setActiveTab] = useState<'orders' | 'claims'>('orders');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Active'>('All');

    // Query parameters mapping
    const getStatusParam = () => {
        if (activeFilter === 'Pending') return 'new';
        if (activeFilter === 'Active') return 'processing';
        return undefined;
    };

    const { data: ordersData, isLoading } = useCatalogueOrders({
        type: 'order',
        branchId: activeBranchId || undefined,
        status: getStatusParam()
    });
    
    // Separate query for stats calculations
    const { data: statsOrdersData } = useCatalogueOrders({
        type: 'order',
        branchId: activeBranchId || undefined,
        limit: 200
    });

    const { data: claimsData, isLoading: claimsLoading } = useBusinessClaims();

    const orders = ordersData?.data || [];
    const statsOrders = statsOrdersData?.data || [];
    const claims = Array.isArray(claimsData) ? claimsData : (claimsData?.data || []);
    const todayStr = new Date().toISOString().split('T')[0];

    const totalCount = statsOrdersData?.total || 0;
    const pendingCount = statsOrders.filter((o: any) => o.status === 'new').length;
    const completedCount = statsOrders.filter((o: any) => o.status === 'completed').length;
    const cancelledCount = statsOrders.filter((o: any) => o.status === 'cancelled' || o.status === 'rejected').length;
    const todayCount = statsOrders.filter((o: any) => o.createdAt?.startsWith(todayStr)).length;

    const claimedCount = claims.filter((c: any) => c.status === 'claimed').length;
    const redeemedCount = claims.filter((c: any) => c.status === 'redeemed').length;

    const stats = [
        { label: 'Total Orders', value: totalCount.toString(), icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending', value: pendingCount.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Completed', value: completedCount.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Cancelled', value: cancelledCount.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Today', value: todayCount.toString(), icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const claimStats = [
        { label: 'Deal Claims', value: claims.length.toString(), icon: Gift, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Pending', value: claimedCount.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Redeemed', value: redeemedCount.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
            <OrdersOverviewHeader />

            {/* Tab Toggle */}
            <div className="flex bg-gray-50 p-1 rounded-xl w-fit mx-auto">
                <button onClick={() => setActiveTab('orders')} className={cn(
                    "px-6 py-2 rounded-lg text-sm font-black transition-all cursor-pointer",
                    activeTab === 'orders' ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}>
                    Orders
                </button>
                <button onClick={() => setActiveTab('claims')} className={cn(
                    "px-6 py-2 rounded-lg text-sm font-black transition-all cursor-pointer",
                    activeTab === 'claims' ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}>
                    Deal Claims
                </button>
            </div>

            {activeTab === 'orders' ? (
                <>
                    <OrderStatusCards stats={stats} />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Active Requests</h3>
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                {(['All', 'Pending', 'Active'] as const).map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setActiveFilter(f)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                                            f === activeFilter ? "bg-white text-[#066CF4] shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {orders.map((order: any) => {
                                const customerName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}`.trim() : 'Walk-in Customer';
                                const time = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                                const itemsStr = order.items?.map((i: any) => `${i.quantity}x ${i.item?.name || i.offer?.name || 'Item'}`).join(', ') || 'No Items';
                                
                                const displayOrder = {
                                    id: order.id,
                                    ref: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
                                    customerName,
                                    date,
                                    time,
                                    items: itemsStr,
                                    status: order.status === 'new' ? 'Pending' : order.status === 'processing' ? 'Active' : order.status === 'completed' ? 'Completed' : order.status
                                };

                                return (
                                    <OrderListCard key={order.id} order={displayOrder} />
                                );
                            })}
                        </div>

                        {orders.length === 0 && (
                           <div className="py-32 text-center bg-white rounded-[48px] border border-dashed border-gray-200">
                              <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                 <ClipboardList size={40} />
                              </div>
                              <h4 className="text-lg font-black text-gray-900 mb-2">Your first order is coming — share your QR code to start</h4>
                              <p className="text-sm font-medium text-gray-400">Share your ordering QR code to start receiving requests.</p>
                           </div>
                        )}
                    </div>

                    <div className="mt-12 flex justify-center">
                        <Button variant="outline" className="h-14 px-10 rounded-2xl border-gray-100 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-[#066CF4] hover:bg-blue-50 transition-all">
                            Load Older Orders
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <OrderStatusCards stats={claimStats} />

                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Deal Claims</h3>

                        {claimsLoading ? (
                            <div className="flex items-center justify-center p-20">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {claims.map((claim: any) => {
                                    const time = claim.createdAt ? new Date(claim.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                    const date = claim.createdAt ? new Date(claim.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                                    const statusLabel = claim.status === 'claimed' ? 'Pending' : claim.status === 'redeemed' ? 'Redeemed' : claim.status;
                                    const statusColor = claim.status === 'claimed' ? 'text-amber-600 bg-amber-50' : claim.status === 'redeemed' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 bg-gray-50';

                                    return (
                                        <div key={claim.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                                        <Gift size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{claim.firstName} {claim.lastName}</p>
                                                        <p className="text-xs text-gray-400">{claim.email} &middot; {claim.phone}</p>
                                                    </div>
                                                </div>
                                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black", statusColor)}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1.5"><Tag size={12} /> {claim.claimCode}</span>
                                                <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {date} {time}</span>
                                                {claim.offer && (
                                                    <span className="flex items-center gap-1.5"><Gift size={12} /> {claim.offer.name}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!claimsLoading && claims.length === 0 && (
                           <div className="py-32 text-center bg-white rounded-[48px] border border-dashed border-gray-200">
                              <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                 <Gift size={40} />
                              </div>
                              <h4 className="text-lg font-black text-gray-900 mb-2">No deal claims yet</h4>
                              <p className="text-sm font-medium text-gray-400">Claims will appear here when customers claim your promotions.</p>
                           </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
