'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { 
    AlertTriangle, Ban, CheckCircle2, Info, 
    ShieldAlert, ShieldCheck, XCircle, Clock
} from 'lucide-react';

interface BusinessActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'approve' | 'suspend' | 'reject' | 'investigate';
    businessName: string;
    onConfirm: (data?: any) => void;
}

export default function BusinessActionModal({ 
    isOpen, 
    onClose, 
    type, 
    businessName,
    onConfirm 
}: BusinessActionModalProps) {
    const config = {
        approve: {
            title: 'Approve Network Entry',
            icon: <ShieldCheck className="text-emerald-500" size={48} />,
            desc: `Are you sure you want to approve ${businessName} for the Discovery Network? They will be visible to all nearby visitors.`,
            confirmText: 'Approve & Activate',
            confirmClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
        },
        suspend: {
            title: 'Suspend from Network',
            icon: <Ban className="text-rose-500" size={48} />,
            desc: `This will immediately remove ${businessName} from all visitor recommendations. All active offers will be hidden.`,
            confirmText: 'Confirm Suspension',
            confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
        },
        reject: {
            title: 'Reject Application',
            icon: <XCircle className="text-rose-500" size={48} />,
            desc: `Declining ${businessName}'s application to join the Discovery Network. Please provide a reason for the rejection.`,
            confirmText: 'Send Rejection',
            confirmClass: 'bg-text-main hover:bg-gray-800 shadow-gray-200'
        },
        investigate: {
            title: 'Begin Fraud Investigation',
            icon: <ShieldAlert className="text-amber-500" size={48} />,
            desc: `Flagging ${businessName} for manual review. This will freeze their attribution payouts until the case is resolved.`,
            confirmText: 'Start Investigation',
            confirmClass: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
        }
    };

    const active = config[type];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={active.title}>
            <div className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 p-4 rounded-3xl bg-gray-50 border border-gray-100 shadow-inner">
                    {active.icon}
                </div>
                
                <h3 className="text-2xl font-display font-bold text-text-main mb-3">{active.title}</h3>
                <p className="text-sm font-medium text-text-secondary leading-relaxed max-w-sm mb-8">
                    {active.desc}
                </p>

                {(type === 'reject' || type === 'suspend') && (
                    <div className="w-full mb-8 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Internal Admin Note / Reason</label>
                        <textarea 
                            placeholder="e.g. Terms of service violation, incomplete business profiling..."
                            className="w-full h-32 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                        />
                    </div>
                )}

                <div className="flex w-full gap-3 mt-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl border border-gray-200 text-text-main text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm()}
                        className={`flex-[1.5] h-12 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${active.confirmClass}`}
                    >
                        {active.confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
