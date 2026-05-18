'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2, Info, Box } from 'lucide-react';
import { usePurchaseAddOn, useBundleDiscounts } from '@/services/addons/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { AddOn } from '@/services/addons/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    addons: AddOn[];
    businessId?: string;
    onSuccess?: () => void;
}

export default function AddOnPurchaseModal({ isOpen, onClose, addons, businessId, onSuccess }: Props) {
    const { user } = useAuthStore();
    const purchaseMutation = usePurchaseAddOn();
    const { data: discountRules = [] } = useBundleDiscounts();
    const [isProcessing, setIsProcessing] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const getBreakdown = () => {
        const rawTotal = addons.reduce((sum, a) => sum + Number(a.price || 0), 0);
        const count = addons.length;
        
        let discountPercent = 0;
        const rule = discountRules
            .filter(r => r.isActive && count >= r.minQuantity && (!r.maxQuantity || count <= r.maxQuantity))
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];
            
        if (rule) {
            discountPercent = rule.discountPercent;
        }

        const discountedTotal = rawTotal * (1 - discountPercent / 100);
        const savings = rawTotal - discountedTotal;

        return {
            rawTotal,
            total: discountedTotal,
            savings,
            discountPercent
        };
    };

    const breakdown = getBreakdown();

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (addons.length === 0) return;

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
                    addonIds: addons.map(a => a.id),
                    paymentReference: `mock-addon-ref-${Date.now()}`
                }, {
                    onSuccess: () => {
                        toast.success(`${addons.length > 1 ? 'Bundle' : addons[0].name} activated!`);
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
            amount: breakdown.total * 100, // Paystack amount is in kobo
            currency: 'NGN',
            ref: `ADDON-${resolvedBusinessId || 'anon'}-${Date.now()}`,
            onClose: () => {
                setIsProcessing(false);
                toast.error('Payment window closed');
            },
            callback: (response: any) => {
                purchaseMutation.mutate({
                    addonIds: addons.map(a => a.id),
                    paymentReference: response.reference,
                }, {
                    onSuccess: () => {
                        toast.success(`${addons.length > 1 ? 'Bundle' : addons[0].name} activated!`);
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
            title={addons.length > 1 ? "Activate Bundle" : "Purchase Power-Up"}
            description={addons.length > 1 ? `Unlock multiple features for your business.` : `Enhance your business with ${addons[0]?.name}.`}
        >
            <div className="space-y-6 py-4">
                {/* Add-ons List Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <div className="space-y-4">
                        {addons.map((addon, idx) => (
                            <div key={addon.id} className={`flex items-center gap-4 ${idx !== 0 ? 'pt-4 border-t border-primary/5' : ''}`}>
                                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                                    addon.type === 'RESOURCE' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                    {addon.type === 'RESOURCE' ? <Box size={20} /> : <Zap size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-text-main tracking-tight uppercase">{addon.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">{addon.description}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-primary">{formatPrice(addon.price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {breakdown.savings > 0 && (
                        <div className="mt-6 pt-4 border-t border-primary/10 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className="line-through">{formatPrice(breakdown.rawTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                <span>Bundle Discount ({breakdown.discountPercent}%)</span>
                                <span>-{formatPrice(breakdown.savings)}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-primary/20">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Total to Pay</span>
                        <span className="text-xl font-black text-primary">{formatPrice(breakdown.total)}</span>
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
                            Once payment is confirmed, these features will be immediately added to your dashboard capabilities.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing || addons.length === 0}
                    className="w-full h-14 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group text-xs uppercase tracking-widest"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Processing Activation...
                        </>
                    ) : (
                        <>
                            Pay {formatPrice(breakdown.total)} & Activate
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
}
