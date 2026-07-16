'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft, Receipt, Store, Calendar, 
    CreditCard, DollarSign, Download, Share2,
    ShieldCheck, Clock, FileText, ArrowRight,
    Info, Building2, User, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscoveryTransactionDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    // Mock details
    const tx = {
        id,
        business: 'Fashion Hub',
        amount: 50000,
        date: '2026-06-10 14:30',
        status: 'Paid',
        method: 'VemTap Wallet',
        type: 'Campaign Budget Allocation',
        description: '30-Day Summer Lookbook Boost (1.5km Radius)',
        items: [
            { desc: 'Base Network Placement', qty: 1, price: 15000 },
            { desc: 'Radius Extension (+1km)', qty: 1, price: 10000 },
            { desc: 'AI Targeting Optimization', qty: 1, price: 25000 },
        ],
        tax: 0,
        total: 50000
    };

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Billing
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl font-bold shadow-inner">
                        <Receipt size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main">Invoice {tx.id}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                {tx.status}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-text-secondary mt-1 italic">{tx.type}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={16} /> Download PDF
                    </button>
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <Share2 size={16} /> Send to Business
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* Invoice Content */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
                        <div className="flex justify-between items-start mb-12 border-b border-gray-50 pb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Billed To</p>
                                <h3 className="text-xl font-display font-bold text-text-main">{tx.business}</h3>
                                <p className="text-sm text-text-secondary mt-1">Wuse 2, Abuja, Nigeria</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Payment Info</p>
                                <p className="text-sm font-bold text-text-main">{tx.method}</p>
                                <p className="text-xs text-text-secondary mt-1">{tx.date}</p>
                            </div>
                        </div>

                        <table className="w-full text-left border-collapse mb-12">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Item Description</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Qty</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Unit Price</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {tx.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-4 font-bold text-text-main">{item.desc}</td>
                                        <td className="py-4 text-center text-text-secondary">{item.qty}</td>
                                        <td className="py-4 text-right text-text-secondary">₦{item.price.toLocaleString()}</td>
                                        <td className="py-4 text-right font-black text-text-main">₦{(item.qty * item.price).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex flex-col items-end gap-3 border-t border-gray-100 pt-8">
                            <div className="flex justify-between w-64 text-sm font-medium text-text-secondary">
                                <span>Subtotal</span>
                                <span>₦{tx.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between w-64 text-sm font-medium text-text-secondary">
                                <span>Tax (VAT 0%)</span>
                                <span>₦0</span>
                            </div>
                            <div className="flex justify-between w-64 pt-4 border-t border-gray-50 mt-2">
                                <span className="text-base font-black text-text-main uppercase tracking-widest">Total Amount</span>
                                <span className="text-xl font-display font-bold text-primary">₦{tx.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Related Resources */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <Info className="text-primary" size={18} />
                            Contextual Info
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-text-secondary">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Related Campaign</p>
                                    <p className="text-sm font-bold text-text-main hover:text-primary cursor-pointer transition-colors">Summer Lookbook Boost</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-text-secondary">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Business Profile</p>
                                    <p className="text-sm font-bold text-text-main hover:text-primary cursor-pointer transition-colors">Fashion Hub</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fraud Check Sidebar */}
                    <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="size-10 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                                <ShieldCheck className="text-emerald-500" size={24} />
                            </div>
                            <h3 className="text-lg font-display font-bold text-emerald-900 mb-2">Payment Verified</h3>
                            <p className="text-emerald-800/70 text-xs font-medium leading-relaxed">
                                This transaction passed all automated fraud checks. Device ID and wallet signature match the authorized business account.
                            </p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
