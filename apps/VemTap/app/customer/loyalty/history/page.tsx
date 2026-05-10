"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Gift, ShoppingBag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const MOCK_HISTORY = [
    { id: 1, type: 'earned', name: 'Purchase at Brew & Co', points: 25, date: 'Today, 2:34 PM', icon: ShoppingBag },
    { id: 2, type: 'redeemed', name: 'Free Pastry Reward', points: 50, date: 'Yesterday, 10:15 AM', icon: Gift },
    { id: 3, type: 'earned', name: 'Visit Bonus', points: 10, date: 'May 8, 2026', icon: Plus },
    { id: 4, type: 'earned', name: 'Purchase at Metro Grocery', points: 100, date: 'May 7, 2026', icon: ShoppingBag },
    { id: 5, type: 'earned', name: 'Sign up Reward', points: 50, date: 'May 5, 2026', icon: Gift },
];

export default function CustomerHistoryPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Points History</h2>
            
            <div className="space-y-4">
                {MOCK_HISTORY.map((item, idx) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-3xl border border-gray-100 p-5 flex items-center justify-between shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-2xl flex items-center justify-center ${
                                item.type === 'earned' ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary'
                            }`}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                                <p className="text-xs text-gray-400 font-medium">{item.date}</p>
                            </div>
                        </div>
                        
                        <div className={`flex items-center gap-1 font-black ${
                            item.type === 'earned' ? 'text-green-600' : 'text-primary'
                        }`}>
                            {item.type === 'earned' ? <Plus size={14} /> : <Minus size={14} />}
                            <span>{item.points}</span>
                            <span className="text-[10px] uppercase tracking-widest ml-0.5">pts</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {MOCK_HISTORY.length === 0 && (
                <div className="py-20 text-center">
                    <p className="text-gray-400">No transactions yet.</p>
                </div>
            )}
        </div>
    );
}
