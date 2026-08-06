'use client';

import React from 'react';
import { useCustomerOrders, Order, CatalogueItem, CatalogueOffer, OrderItem } from '@/services/catalogue/hooks';
import { 
    ShoppingBag, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Calendar,
    ChevronRight,
    MapPin,
    ArrowRight,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { bg: string, text: string, icon: any, label: string }> = {
        new: { bg: 'bg-blue-50', text: 'text-blue-600', icon: AlertCircle, label: 'Pending' },
        processing: { bg: 'bg-orange-50', text: 'text-orange-600', icon: Clock, label: 'In Progress' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2, label: 'Completed' },
        cancelled: { bg: 'bg-slate-50', text: 'text-slate-600', icon: XCircle, label: 'Cancelled' },
        rejected: { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, label: 'Rejected' },
        refunded: { bg: 'bg-violet-50', text: 'text-violet-600', icon: XCircle, label: 'Refunded' },
        partial_refund: { bg: 'bg-pink-50', text: 'text-pink-600', icon: AlertCircle, label: 'Partially Refunded' },
    };

    const config = configs[status] || configs.new;
    const Icon = config.icon;

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", config.bg, config.text)}>
            <Icon size={12} />
            {config.label}
        </div>
    );
};

export default function CustomerOrdersPage() {
    const { data: orders = [], isLoading } = useCustomerOrders();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-14 space-y-3">
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading your history...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-5 md:space-y-8 pb-20 p-4 md:p-0">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Orders & Bookings</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Keep track of your purchases and reservations across all businesses.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
                {orders.map((order: Order) => (
                    <div 
                        key={order.id} 
                        className="bg-white rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-primary/10 transition-all group"
                    >
                        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-8">
                            {/* Business & Date */}
                            <div className="md:w-64 space-y-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business</p>
                                    <h3 className="text-base md:text-lg font-black text-slate-900 leading-tight">
                                        {order.branch?.business?.name || 'Unknown Business'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <MapPin size={12} />
                                        {order.branch?.name}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Date</p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {format(new Date(order.createdAt), 'MMM dd, yyyy • hh:mm a')}
                                    </p>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>

                            {/* Items */}
                            <div className="flex-1 space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items Ordered</p>
                                <div className="grid grid-cols-1 gap-2 md:gap-3">
                                    {order.items.map((oi: OrderItem) => (
                                        <div key={oi.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                                            <div className="size-11 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-100">
                                                {(oi.offer?.mainImage || oi.item?.mainImage) ? (
                                                    <img 
                                                        src={oi.offer?.mainImage || oi.item?.mainImage} 
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="size-full flex items-center justify-center text-slate-200">
                                                        <Star size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-900 truncate">
                                                    {oi.offer?.name || oi.item?.name || 'Unknown Item'}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Qty: {oi.quantity} • ₦{Number(oi.priceAtOrder).toLocaleString()}
                                                </p>
                                            </div>
                                            {oi.loyaltyPointsAtOrder && (
                                                <div className="px-2 py-1 bg-amber-50 rounded-lg flex items-center gap-1">
                                                    <Star size={10} className="text-amber-500" fill="currentColor" />
                                                    <span className="text-[9px] font-black text-amber-600">+{oi.loyaltyPointsAtOrder * oi.quantity}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total & Action */}
                            <div className="md:w-48 flex flex-col justify-between items-end gap-4 text-right">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                                    <p className="text-xl md:text-2xl font-black text-primary font-display">
                                        ₦{Number(order.totalAmount).toLocaleString()}
                                    </p>
                                </div>
                                <Link 
                                    href={`/customer/messaging/chat?branchId=${order.branchId}&orderId=${order.id}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all group-hover:-translate-x-1"
                                >
                                    Contact Business
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <ShoppingBag size={28} />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-lg font-black text-slate-900 uppercase tracking-widest">No orders yet</p>
                            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Once you place an order or book a service, it will appear here.</p>
                        </div>
                        <Link 
                            href="/customer/discover" 
                            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                        >
                            Explore Businesses
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
