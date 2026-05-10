"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    QrCode, 
    History, 
    Gift, 
    ChevronRight, 
    Star, 
    TrendingUp, 
    LayoutGrid, 
    CreditCard,
    X,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { QRCodeCanvas } from 'qrcode.react';

export default function CustomerLoyaltyPage() {
    const user = useAuthStore((state) => state.user);
    const [showQR, setShowQR] = useState(false);

    const stats = [
        { label: 'Available Points', value: '1,250', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Total Earned', value: '4,890', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Rewards Claimed', value: '12', icon: Gift, color: 'text-primary', bg: 'bg-primary/5' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Points Hero Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-gray-900/30"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                    <Star size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
                            Premium Member
                        </Badge>
                        <div className="space-y-1">
                            <h2 className="text-gray-400 font-medium uppercase tracking-[0.2em] text-xs">Your Balance</h2>
                            <p className="text-6xl md:text-7xl font-black tracking-tighter">1,250 <span className="text-2xl text-gray-500">pts</span></p>
                        </div>
                        <div className="flex items-center gap-4 pt-4">
                            <Button 
                                onClick={() => setShowQR(true)}
                                className="rounded-2xl bg-white text-gray-900 font-black px-8 py-7 hover:bg-gray-100 gap-2 text-base shadow-xl active:scale-95 transition-all"
                            >
                                <QrCode size={22} /> Redeem Now
                            </Button>
                            <Link href="/customer/loyalty/history">
                                <Button variant="ghost" className="text-white hover:bg-white/10 h-14 px-6 rounded-2xl gap-2 font-bold">
                                    <History size={20} /> History
                                </Button>
                            </Link>
                        </div>
                    </div>
                    
                    <div className="hidden lg:block w-px h-32 bg-white/10" />
                    
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Gift className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">3 Rewards Ready</p>
                                <p className="text-xs text-gray-400">Next reward at 1,500 pts</p>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '83%' }}
                                className="h-full bg-primary"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5"
                    >
                        <div className={`size-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Available Rewards Preview */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Recommended for You</h3>
                    <Link href="#" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                        View all <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: 'Free Coffee', cost: 500, type: 'Item', img: 'bg-orange-50' },
                        { title: '15% Off Total', cost: 1000, type: 'Discount', img: 'bg-blue-50' }
                    ].map((reward) => (
                        <div key={reward.title} className="bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 group hover:shadow-md transition-all cursor-pointer">
                            <div className={`w-24 h-24 rounded-2xl ${reward.img} flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform`}>
                                <Gift size={32} />
                            </div>
                            <div className="flex flex-col justify-center flex-1">
                                <Badge className="w-fit mb-1 bg-gray-50 text-gray-500 border-none rounded-lg">{reward.type}</Badge>
                                <h4 className="font-bold text-gray-900 text-lg">{reward.title}</h4>
                                <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">{reward.cost} Points</p>
                            </div>
                            <div className="flex items-center pr-2">
                                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* QR Modal */}
            <AnimatePresence>
                {showQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQR(false)}
                            className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] p-8 max-w-sm w-full relative z-10 shadow-2xl overflow-hidden"
                        >
                            <button 
                                onClick={() => setShowQR(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="text-center space-y-6 pt-4">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900">Show to Redeem</h3>
                                    <p className="text-sm text-gray-500 px-8">Ask the merchant to scan this QR code to process your reward.</p>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
                                        <QRCodeCanvas 
                                            value={user?.id || "demo-user-id"} 
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Customer ID</p>
                                        <p className="text-sm font-bold text-gray-900">#{user?.id?.slice(0, 8).toUpperCase() || "VEMTAP-881"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 justify-center py-2 text-emerald-500 font-bold">
                                    <CheckCircle2 size={18} />
                                    <span className="text-xs uppercase tracking-widest">Active & Ready</span>
                                </div>

                                <Button 
                                    onClick={() => setShowQR(false)}
                                    className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest"
                                >
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
