'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    ShoppingBag,
    FileText,
    ChevronRight,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    ExternalLink
} from 'lucide-react';
import { fetchMyQuotes, fetchMyOrders, acceptQuote, rejectQuote } from '@/lib/api/marketplace';
import { useAuthStore } from '@/store/useAuthStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketplaceOrder, MarketplaceQuote } from '@/types/marketplace';

export default function MarketplaceActivityPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'quotes' | 'orders'>('quotes');
    const queryClient = useQueryClient();

    const { data: quotes, isLoading: quotesLoading } = useQuery<MarketplaceQuote[]>({
        queryKey: ['my-quotes'],
        queryFn: () => fetchMyQuotes(),
        enabled: isAuthenticated
    });

    const { data: orders = [], isLoading: ordersLoading } = useQuery<MarketplaceOrder[]>({
        queryKey: ['my-orders'],
        queryFn: () => fetchMyOrders(),
        enabled: isAuthenticated
    });

    const acceptMutation = useMutation({
        mutationFn: acceptQuote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
            queryClient.invalidateQueries({ queryKey: ['my-orders'] });
            toast.success('Quote accepted! An order has been created.');
            setActiveTab('orders');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to accept quote');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: rejectQuote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
            toast.success('Quote rejected.');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject quote');
        }
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag size={40} className="text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to see your activity</h2>
                    <p className="text-gray-500 mb-8 max-w-sm">You need an account to track your quotes and hardware orders.</p>
                    <Link href="/login" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">
                        Login Now
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-32 flex-1 w-full">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/marketplace" className="text-xs font-bold text-primary flex items-center gap-1 mb-2 hover:underline">
                            <ArrowLeft size={14} /> Back to Marketplace
                        </Link>
                        <h1 className="text-3xl font-display font-bold text-text-main tracking-tight">Marketplace Activity</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab('quotes')}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'quotes' ? 'text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        My Quotes {(quotes?.length ?? 0) > 0 && `(${quotes?.length})`}
                        {activeTab === 'quotes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'orders' ? 'text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        Order History {(orders?.length ?? 0) > 0 && `(${orders?.length})`}
                        {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                </div>

                {activeTab === 'quotes' ? (
                    <div className="space-y-4">
                        {quotesLoading ? (
                            <div className="py-20 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : quotes && (quotes as MarketplaceQuote[]).length > 0 ? (
                            (quotes as MarketplaceQuote[]).map((quote) => (
                                <div key={quote.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                                                <img src={quote.product?.image || "/assets/nfc/Card NFC Plate White.avif"} alt={quote.product?.name} className="w-full h-full object-contain p-2" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">{quote.product?.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-text-secondary">
                                                    <span className="flex items-center gap-1 font-medium italic">
                                                        <Package size={12} /> {quote.quantity} units
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> Requested {new Date(quote.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${quote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    quote.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                    {quote.status === 'Accepted' ? <CheckCircle2 size={12} /> :
                                                        quote.status === 'Rejected' ? <XCircle size={12} /> :
                                                            <Clock size={12} />}
                                                    {quote.status}
                                                </div>
                                            </div>
                                            <Link href={`/marketplace/product/${quote.productId}`} className="size-10 bg-gray-50 rounded-xl flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-all">
                                                <ChevronRight size={20} />
                                            </Link>
                                        </div>
                                    </div>
                                    {quote.currentPrice && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm font-medium text-text-secondary">Admin Offered Price:</p>
                                                <p className="text-xl font-black text-text-main">₦{Number(quote.currentPrice).toLocaleString()}</p>
                                            </div>

                                            {quote.status === 'Accepted' && (
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => rejectMutation.mutate(quote.id)}
                                                        disabled={rejectMutation.isPending || acceptMutation.isPending}
                                                        className="flex-1 sm:flex-none h-11 px-6 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all text-xs"
                                                    >
                                                        {rejectMutation.isPending ? '...' : 'Reject'}
                                                    </button>
                                                    <button
                                                        onClick={() => acceptMutation.mutate(quote.id)}
                                                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                                                        className="flex-1 sm:flex-none h-11 px-8 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all text-xs flex items-center justify-center gap-2"
                                                    >
                                                        {acceptMutation.isPending ? 'Processing...' : 'Accept & Order'}
                                                        {!acceptMutation.isPending && <ChevronRight size={16} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText size={28} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No quotes yet</h3>
                                <p className="text-sm text-gray-500 mb-6">Request bulk pricing to see your quotes here.</p>
                                <Link href="/marketplace" className="text-primary font-bold hover:underline">Browse Products</Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ordersLoading ? (
                            <div className="py-20 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : orders && orders.length > 0 ? (
                            orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                                                <img src={order.product?.image || "/assets/nfc/Card NFC Plate White.avif"} alt={order.product?.name} className="w-full h-full object-contain p-2" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-main">{order.product?.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-text-secondary">
                                                    <span className="font-bold text-primary">₦{Number(order.totalPrice).toLocaleString()}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Package size={12} /> {order.quantity} units
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right px-4 border-r border-gray-100 hidden sm:block">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Payment</p>
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </div>
                                            <div className="text-right px-4 border-r border-gray-100 hidden sm:block">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Fulfillment</p>
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${order.status === 'Ready' || order.status === 'Delivered' ? 'text-primary' : 'text-slate-500'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <a href={`/dashboard/hardware`} className="h-10 px-4 bg-gray-50 text-text-main font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 text-xs">
                                                Setup NFC <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag size={28} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No orders yet</h3>
                                <p className="text-sm text-gray-500 mb-6">Your hardware purchases will appear here.</p>
                                <Link href="/marketplace" className="text-primary font-bold hover:underline">Browse Products</Link>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
