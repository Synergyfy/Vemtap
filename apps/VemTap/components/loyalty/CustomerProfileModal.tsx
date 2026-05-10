"use client";

import React from 'react';
import Modal from '@/components/ui/Modal';
import { Visitor } from '@/services/visitors/types';
import { usePointTransactions } from '@/services/loyalty/hooks';
import { PointsHistory } from './PointsHistory';
import { 
    User, 
    Mail, 
    Phone, 
    Calendar, 
    Award, 
    Zap, 
    ArrowUpRight, 
    Loader2,
    ShieldCheck,
    History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface CustomerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitor: Visitor | null;
}

export default function CustomerProfileModal({ isOpen, onClose, visitor }: CustomerProfileModalProps) {
    const profileId = visitor?.loyaltyProfile?.id;
    const { data: transactions = [], isLoading } = usePointTransactions(profileId || '');

    if (!visitor) return null;

    const points = visitor.loyaltyProfile?.pointsBalance || 0;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="lg"
        >
            <div className="space-y-8">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="size-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary relative shrink-0">
                        <User size={40} />
                        <div className="absolute -bottom-2 -right-2 bg-primary text-white size-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <Award size={18} />
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black text-slate-900">{visitor.firstName} {visitor.lastName}</h2>
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1 rounded-full">
                                    Active Member
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-slate-500 font-medium text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Mail size={14} className="text-slate-400" />
                                    {visitor.email || 'No email provided'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Phone size={14} className="text-slate-400" />
                                    {visitor.phone || 'No phone provided'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Zap size={10} /> Points Balance
                                </p>
                                <p className="text-2xl font-black text-primary">{points.toLocaleString()} <span className="text-xs">PTS</span></p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Calendar size={10} /> Last Visit
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {visitor.lastVisit ? new Date(visitor.lastVisit).toLocaleDateString() : 'New Customer'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <ShieldCheck size={10} /> Tier Level
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {points > 1000 ? 'Platinum' : points > 500 ? 'Gold' : 'Silver'} Status
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Point History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 text-white rounded-xl">
                                <History size={18} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Points Activity History</h3>
                        </div>
                        <Badge variant="outline" className="text-slate-400 border-slate-200">
                            {transactions.length} Total Logs
                        </Badge>
                    </div>

                    <div className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching Transaction Logs...</p>
                            </div>
                        ) : (
                            <PointsHistory transactions={transactions} className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide" />
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </Modal>
    );
}
