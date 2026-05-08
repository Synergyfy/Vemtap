'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2, Info, Box } from 'lucide-react';
import { usePurchaseAddOn } from '@/services/addons/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { AddOn } from '@/services/addons/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    addon: AddOn;
    businessId?: string;
    onSuccess?: () => void;
}

export default function AddOnPurchaseModal({ isOpen, onClose, addon, businessId, onSuccess }: Props) {
    const { user } = useAuthStore();
    const purchaseMutation = usePurchaseAddOn();
    const [isProcessing, setIsProcessing] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        const email = user?.email || '';
        if (!email) {
            toast.error('User email not found. Please log in again.');
            return;
        }
        const resolvedBusinessId = businessId || user?.businessId;

        setIsProcessing(true);

        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

        if (!publicKey || publicKey.includes('placeholder')) {
            // Fallback for demo
            setTimeout(() => {
                purchaseMutation.mutate({
                    addonIds: [addon.id],
                    paymentReference: `mock-addon-ref-${Date.now()}`
                }, {
                    onSuccess: () => {
                        toast.success(`${addon.name} activated!`);
                        setIsProcessing(false);
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            onClose();
                        }
                    },
                    onError: (error) => {
                        setIsProcessing(false);
                        toast.error(error instanceof Error ? error.message : 'Activation failed. Please contact support.');
                    }
                });
            }, 1500);
            return;
        }

        // @ts-ignore
        const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: addon.price * 100, // Paystack amount is in kobo
            currency: 'NGN',
            ref: `ADDON-${resolvedBusinessId || 'anon'}-${Date.now()}`,
            onClose: () => {
                setIsProcessing(false);
                toast.error('Payment window closed');
            },
            callback: (response: any) => {
                purchaseMutation.mutate({
                    addonIds: [addon.id],
                    paymentReference: response.reference,
                }, {
                    onSuccess: () => {
                        toast.success(`${addon.name} activated!`);
                        setIsProcessing(false);
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            onClose();
                        }
                    },
                    onError: (error) => {
                        setIsProcessing(false);
                        toast.error(error instanceof Error ? error.message : 'Payment verified but activation failed. Please contact support.');
                    }
                });
            }
        });
        handler.openIframe();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Purchase Power-Up"
            description={`Enhance your business with ${addon.name}.`}
        >
            <div className="space-y-6 py-4">
                {/* Add-on Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`size-12 rounded-xl flex items-center justify-center ${
                            addon.type === 'RESOURCE' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                            {addon.type === 'RESOURCE' ? <Box size={24} /> : <Zap size={24} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Power-Up Card</p>
                            <h4 className="text-lg font-black text-text-main tracking-tight">{addon.name}</h4>
                        </div>
                    </div>

                    <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">
                        {addon.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">One-time Activation</span>
                        <span className="text-xl font-black text-primary">{formatPrice(addon.price)}</span>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4">
                    <div className="size-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldCheck className="text-emerald-500" size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900 mb-0.5">Instant Activation</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                            Once payment is confirmed, the {addon.name} features will be immediately added to your dashboard capabilities.
                        </p>
                    </div>
                </div>

                {/* Secure Info */}
                <div className="flex items-center justify-center gap-8 text-[9px] font-black text-text-secondary uppercase tracking-widest py-2 border-y border-slate-50">
                    <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-primary" />
                        SECURE PAYSTACK
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        INSTANT DELIVERY
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full h-14 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group text-xs uppercase tracking-widest"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Processing Activation...
                        </>
                    ) : (
                        <>
                            Pay {formatPrice(addon.price)} & Activate
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <p className="text-center text-[10px] font-medium text-slate-400">
                    By activating, you agree to our <span className="underline cursor-pointer">Service Terms</span>.
                </p>
            </div>
        </Modal>
    );
}
