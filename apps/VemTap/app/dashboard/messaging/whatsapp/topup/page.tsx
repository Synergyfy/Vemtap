'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Wallet, Plus, ArrowUpRight, Clock, Star, Loader2 } from 'lucide-react';
import TopUpModal from '@/components/messaging/TopUpModal';
import { fetchMyCredits } from '@/lib/api/credit-plans';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';

export default function WhatsAppTopUpPage() {
    const { user } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: credits, isLoading } = useQuery({
        queryKey: ['my-credits'],
        queryFn: () => fetchMyCredits(),
        refetchInterval: 30000,
    });

    const whatsappCredits = credits?.whatsappCredits ?? 0;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <PageHeader
                title="WhatsApp Credits"
                description="Manage your WhatsApp messaging balance and transaction history."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-9 md:size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                <Wallet size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-text-main tracking-tight">Available Balance</h3>
                                <p className="text-xs text-text-secondary">Current points in your messaging wallet</p>
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-20">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <p className="text-2xl md:text-3xl font-bold text-text-main mb-8">
                                {whatsappCredits.toLocaleString()} <span className="text-xl text-primary uppercase">Points</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 bg-primary text-white font-semibold uppercase tracking-wider text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Plus size={18} />
                        Add Credits Now
                    </button>
                </div>

                <div className="bg-primary rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-primary/20">
                    <Star className="opacity-40" size={32} />
                    <div>
                        <h4 className="font-bold text-lg mb-2">Auto-Recharge</h4>
                        <p className="text-xs text-white/80 leading-relaxed mb-6">Never run out of points during a campaign. Enable auto-refill when balance is low.</p>
                        <button className="w-full py-3 bg-white/20 backdrop-blur-md rounded-xl font-bold text-xs uppercase hover:bg-white/30 transition-all border border-white/30">
                            Configure
                        </button>
                    </div>
                </div>
            </div>

            <TopUpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => {
                // Refetch credits after successful purchase - this is handled by React Query cache invalidation in the modal
            }} />
        </div>
    );
}
