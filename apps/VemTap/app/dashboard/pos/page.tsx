'use client';

import React from 'react';
import { CreditCard, Sparkles } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';

export default function POSPage() {
    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto">
            <PageHeader 
                title="Point of Sale (POS)" 
                description="Process fast in-person transactions and manage orders."
            />
            
            <div className="mt-8 bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
                    <CreditCard size={40} className="text-emerald-600" />
                    <div className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-600 p-1.5 rounded-full">
                        <Sparkles size={16} />
                    </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold mb-6">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                    </span>
                    Coming Soon
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 mb-4 max-w-xl">
                    Seamless Checkout Experience
                </h2>
                
                <p className="text-gray-500 text-lg max-w-2xl leading-relaxed mb-8">
                    The Point of Sale (POS) system will enable you to process fast in-person transactions, manage walk-in orders, apply discounts, and generate digital or physical receipts directly from your dashboard.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full text-left mt-8">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="font-black text-gray-900 mb-2">Fast Checkout</div>
                        <div className="text-sm text-gray-500">Tap-to-add products and quickly process customer payments.</div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="font-black text-gray-900 mb-2">Order Management</div>
                        <div className="text-sm text-gray-500">Keep track of open orders, tabs, and daily transaction history.</div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="font-black text-gray-900 mb-2">Digital Receipts</div>
                        <div className="text-sm text-gray-500">Instantly send receipts via email or SMS, or connect a printer.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
