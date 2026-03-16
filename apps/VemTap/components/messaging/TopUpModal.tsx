'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, CreditCard, Star, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCreditPlans, purchaseCreditPlan, CreditPlan } from '@/lib/api/credit-plans';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedPack, setSelectedPack] = useState<number | null>(null);

    const { data: creditPlans, isLoading, error } = useQuery({
        queryKey: ['credit-plans'],
        queryFn: () => fetchCreditPlans(),
        enabled: isOpen,
    });

    const purchaseMutation = useMutation({
        mutationFn: async ({ planId, reference }: { planId: string; reference: string }) => {
            const businessId = user?.businessId;
            if (!businessId) throw new Error('Business ID not found');
            return purchaseCreditPlan(planId, { businessId, reference });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-credits'] });
            toast.success('Credits purchased successfully!');
            onClose();
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to purchase credits');
        }
    });

    const handlePurchase = async (plan: CreditPlan) => {
        const email = user?.email;
        if (!email) {
            toast.error('User email not found. Please log in again.');
            return;
        }

        const businessId = user?.businessId;
        if (!businessId) {
            toast.error('Business ID not found. Please refresh and try again.');
            return;
        }

        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

        if (!publicKey || publicKey.includes('placeholder')) {
            console.warn('Paystack public key not configured. Using mock success.');
            purchaseMutation.mutate({
                planId: plan.id,
                reference: `mock-ref-${Date.now()}`
            });
            return;
        }

        // @ts-ignore
        const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: plan.price * 100,
            currency: 'NGN',
            ref: `TOPUP-${businessId}-${Date.now()}`,
            onClose: () => {
                toast.error('Payment window closed');
            },
            callback: (response: any) => {
                purchaseMutation.mutate({
                    planId: plan.id,
                    reference: response.reference
                });
            }
        });

        handler.openIframe();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const getIconForPlan = (index: number) => {
        const icons = [Zap, Star, ShieldCheck];
        return icons[index % icons.length];
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 bg-primary flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
                                    <Wallet className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-black text-text-main uppercase tracking-tight leading-none mb-1">Top-up Wallet</h3>
                                    <p className="text-[10px] text-text-secondary font-medium uppercase tracking-[0.2em]">Purchase messaging credits</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="size-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">

                            <p className="text-sm text-text-secondary text-center max-w-sm mx-auto">
                                Points are dedicated to your <span className="text-primary font-black uppercase">WhatsApp</span> channel and cannot be transferred.
                            </p>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <p className="text-red-500 text-sm">Failed to load credit plans. Please try again.</p>
                                </div>
                            ) : creditPlans && creditPlans.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {creditPlans.map((plan, i) => {
                                        const Icon = getIconForPlan(i);
                                        const isSelected = selectedPack === i;
                                        return (
                                            <button
                                                key={plan.id}
                                                onClick={() => setSelectedPack(i)}
                                                className={`relative p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-black text-text-main">{plan.whatsappAmount.toLocaleString()} Points</span>
                                                            {i === 1 && (
                                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-primary text-white rounded-full">Best Value</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-text-secondary">{formatPrice(plan.price)}</span>
                                                    </div>
                                                </div>
                                                {plan.description && (
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-primary uppercase block">{plan.description}</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-text-secondary text-sm">No credit plans available at the moment.</p>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (selectedPack !== null && creditPlans) {
                                        handlePurchase(creditPlans[selectedPack]);
                                    }
                                }}
                                disabled={selectedPack === null || purchaseMutation.isPending}
                                className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {purchaseMutation.isPending ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <CreditCard size={18} />
                                        Purchase Points
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-text-secondary text-center uppercase tracking-tighter">
                                Secure payment powered by Paystack & Flutterwave
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
