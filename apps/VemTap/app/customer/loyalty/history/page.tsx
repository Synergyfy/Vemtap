"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Gift, ShoppingBag, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { useCustomerGlobalHistory } from '@/services/customer/hooks';

export default function CustomerHistoryPage() {
    const { data: historyResponse, isLoading } = useCustomerGlobalHistory();
    const history = Array.isArray(historyResponse) ? historyResponse : (historyResponse?.data || []);

    const getTransactionDetails = (tx: any) => {
        const type = tx.pointsAmount > 0 ? 'earned' : 'redeemed';
        const name = tx.reason || (type === 'earned' ? 'Points Earned' : 'Reward Redeemed');
        const icon = tx.transactionType === 'REDEEMED' ? Gift : ShoppingBag;
        
        return { type, name, icon };
    };

    if (isLoading && history.length === 0) {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={28} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching your history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Points History</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{history.length} Transactions</p>
            </div>
            
            <div className="space-y-3">
                {history.map((tx: any, idx: number) => {
                    const { type, name, icon: IconComp } = getTransactionDetails(tx);
                    return (
                        <motion.div 
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center justify-between shadow-sm hover:border-primary/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${
                                    type === 'earned' ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary'
                                }`}>
                                    <IconComp size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-[13px] line-clamp-1">{name}</h3>
                                    <p className="text-[11px] text-gray-400 font-medium">
                                        {new Date(tx.createdAt).toLocaleDateString(undefined, { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                            
                            <div className={`flex items-center gap-1 font-black shrink-0 ${
                                type === 'earned' ? 'text-green-600' : 'text-primary'
                            }`}>
                                {type === 'earned' ? <Plus size={14} /> : <Minus size={14} />}
                                <span>{Math.abs(tx.pointsAmount)}</span>
                                <span className="text-[10px] uppercase tracking-widest ml-0.5">pts</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {history.length === 0 && (
                <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium text-sm">Your history is currently empty.</p>
                    <p className="text-xs text-gray-400 mt-1">Start tapping at VemTap terminals to earn points!</p>
                </div>
            )}
        </div>
    );
}
