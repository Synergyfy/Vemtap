'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Gift,
    Store,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Shield,
    Loader2,
} from 'lucide-react';
import { useGiftByToken, useRejectDealGift } from '@/services/deals/hooks';
import { toast } from 'react-hot-toast';

const COMMON_REASONS = [
    "I'm not interested in this deal",
    'Location is too far from my area',
    'I already claimed or redeemed this previously',
    'I did not expect or recognize this gift',
    'Other reason',
];

function GiftRejectContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') || '';

    const { data: gift, isLoading, isError, error } = useGiftByToken(token);
    const rejectMutation = useRejectDealGift();

    const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
    const [customReason, setCustomReason] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast.error('Invalid or missing gift token');
            return;
        }

        const finalReason =
            selectedReason === 'Other reason'
                ? customReason.trim() || 'Declined by recipient (other reason)'
                : customReason.trim()
                ? `${selectedReason}: ${customReason.trim()}`
                : selectedReason;

        try {
            await rejectMutation.mutateAsync({
                token,
                reason: finalReason,
            });
            setIsSubmitted(true);
            toast.success('Gift successfully declined');
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ||
                err?.message ||
                'Failed to decline gift. It may have already been processed.'
            );
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={24} />
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 mb-2">Invalid Gift Link</h1>
                    <p className="text-sm text-slate-600 mb-6">
                        No valid token was found in the link. Please verify the link in your email.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
                    >
                        Return to VemTap Home
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">Loading gift details...</p>
                </div>
            </div>
        );
    }

    if (isError || !gift) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
                        <Gift size={24} />
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 mb-2">Gift Not Available</h1>
                    <p className="text-sm text-slate-600 mb-6">
                        {(error as any)?.response?.data?.message ||
                            'This gift link has expired or has already been processed.'}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
                    >
                        Browse Deals on VemTap
                    </Link>
                </div>
            </div>
        );
    }

    if (isSubmitted || gift.status === 'rejected') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={26} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Gift Declined</h1>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        You have declined this deal. Your contact details have been removed and you will
                        not receive further notifications regarding this gift.
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-500 mb-6 space-y-1">
                        <p><span className="font-semibold text-slate-700">Deal:</span> {gift.offer?.name}</p>
                        <p><span className="font-semibold text-slate-700">Sender:</span> {gift.senderName || 'A friend'}</p>
                        <p><span className="font-semibold text-slate-700">Status:</span> Declined & Removed</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const claimUrl = `/deals/${gift.business?.slug || 'deal'}/${gift.offer?.id}?giftToken=${token}`;

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block text-xl font-black tracking-tight text-slate-900 mb-3">
                        VemTap
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Decline Deal Gift</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Let us know why you are declining this gift.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    {/* Deal & Sender Summary */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3.5">
                            {gift.offer?.mainImage && (
                                <img
                                    src={gift.offer.mainImage}
                                    alt={gift.offer.name}
                                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-slate-900 truncate">
                                    {gift.offer?.name}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                    <Store size={12} className="shrink-0 text-slate-400" />
                                    {gift.branch?.name || gift.business?.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Gifted by{' '}
                                    <span className="font-semibold text-slate-700">
                                        {gift.senderName || 'A friend'}
                                    </span>{' '}
                                    to <span className="text-slate-700">{gift.recipientEmail}</span>
                                </p>
                            </div>
                        </div>

                        {gift.note && (
                            <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-600 italic">
                                &ldquo;{gift.note}&rdquo;
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                                Reason for declining
                            </label>
                            <div className="space-y-2">
                                {COMMON_REASONS.map((reason) => (
                                    <label
                                        key={reason}
                                        className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                                            selectedReason === reason
                                                ? 'border-slate-900 bg-slate-50 text-slate-900 font-medium'
                                                : 'border-slate-200 text-slate-700 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={reason}
                                            checked={selectedReason === reason}
                                            onChange={() => setSelectedReason(reason)}
                                            className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                                        />
                                        <span>{reason}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Additional Details {selectedReason !== 'Other reason' && '(Optional)'}
                            </label>
                            <textarea
                                rows={3}
                                maxLength={500}
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder={
                                    selectedReason === 'Other reason'
                                        ? 'Please tell us why you are declining...'
                                        : 'Any extra details (optional)...'
                                }
                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Privacy note */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 leading-relaxed">
                            <Shield size={16} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>
                                Declining will store your reason and remove your contact details. The branch will not retain your email, and you will not receive further communications.
                            </span>
                        </div>

                        {/* Buttons */}
                        <div className="pt-2 space-y-2.5">
                            <button
                                type="submit"
                                disabled={rejectMutation.isPending}
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                            >
                                {rejectMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Confirm & Decline Gift'
                                )}
                            </button>

                            <Link
                                href={claimUrl}
                                className="w-full h-10 bg-transparent hover:bg-slate-100 text-slate-600 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <ArrowLeft size={14} /> Changed your mind? Claim this deal instead
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function GiftRejectPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                </div>
            }
        >
            <GiftRejectContent />
        </Suspense>
    );
}
