'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, FileText, Lock } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';

interface PartnershipVerificationGuardProps {
    children: React.ReactNode;
}

export default function PartnershipVerificationGuard({ children }: PartnershipVerificationGuardProps) {
    const router = useRouter();
    const { data: business, isLoading } = useMyBusiness();

    const isPendingOrInactive = !!business && business.status !== 'active';

    if (isLoading) {
        return <>{children}</>;
    }

    if (isPendingOrInactive) {
        return (
            <div className="relative w-full min-h-[600px]">
                {/* Locked / Blurred background content */}
                <div className="pointer-events-none filter blur-md select-none opacity-40 aria-hidden:true">
                    {children}
                </div>

                {/* Persistent Non-Closable Modal Overlay */}
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-200">
                        {/* Icon */}
                        <div className="size-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <ShieldAlert size={32} />
                        </div>

                        {/* Title */}
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-2 flex items-center justify-center gap-2">
                            <Lock size={20} className="text-amber-500" />
                            Partnerships Locked
                        </h2>

                        {/* Message */}
                        <p className="text-xs md:text-sm text-gray-600 font-normal leading-relaxed mb-6">
                            You cannot create or participate in business partnerships because your business has not yet been approved by an administrator.
                        </p>

                        <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 mb-6 text-left">
                            <p className="text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                                <FileText size={14} className="text-amber-600" />
                                Action Required
                            </p>
                            <p className="text-[11px] text-amber-800 leading-normal font-normal">
                                Upload your CAC certificate, owner ID card, and utility bill in settings so our admin team can verify and activate your business.
                            </p>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => router.push('/dashboard/settings/profile')}
                            className="w-full h-12 md:h-13 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                            <FileText size={18} />
                            Upload Verification Documents
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
