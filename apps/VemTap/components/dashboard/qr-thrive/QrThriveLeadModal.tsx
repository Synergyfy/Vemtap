'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Calendar, Hash, Smartphone, ChevronRight, Mail, CheckCircle, Clock, Loader2, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { QrThriveLead } from '@/services/qr-thrive/types';
import { useUpdateQrThriveLeadStatus } from '@/services/qr-thrive/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

interface QrThriveLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: QrThriveLead | null;
}

export default function QrThriveLeadModal({ isOpen, onClose, lead }: QrThriveLeadModalProps) {
    const { activeBranchId } = useAuthStore();
    const updateStatus = useUpdateQrThriveLeadStatus();
    
    if (!lead) return null;

    const handleStatusUpdate = (newStatus: string) => {
        if (!activeBranchId) return;
        updateStatus.mutate({ 
            leadId: lead.id, 
            status: newStatus, 
            branchId: activeBranchId 
        }, {
            onSuccess: () => {
                toast.success(`Status updated to ${newStatus}`);
                onClose();
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to update status');
            }
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Submission Details</h3>
                                    <p className="text-sm text-slate-400 font-medium">From {lead.form.title}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <Calendar size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Submitted</p>
                                            <p className="text-sm font-bold text-slate-900">{format(new Date(lead.createdAt), 'MMMM d, yyyy')}</p>
                                            <p className="text-xs font-medium text-slate-400">{format(new Date(lead.createdAt), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <Smartphone size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source QR</p>
                                            <p className="text-sm font-bold text-slate-900">{lead.form.qrCode.name}</p>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{lead.form.qrCode.type}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <Hash size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Reference</p>
                                            <p className="text-xs font-mono font-bold text-slate-600 truncate max-w-[140px]">{lead.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <CheckCircle size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mt-1 ${
                                                lead.localStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                lead.localStatus === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                lead.localStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {lead.localStatus || 'new'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Submission Data</h4>
                                
                                {/* 1. Specialized Booking Info (New) */}
                                {lead.answers.type === 'booking' && (
                                    <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 mb-6 shadow-sm">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            Booking Request
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                            {[
                                                { label: 'Service', value: lead.answers.serviceTitle },
                                                { label: 'Date', value: lead.answers.date },
                                                { label: 'Time', value: lead.answers.time },
                                                { label: 'Price', value: lead.answers.price },
                                                { label: 'Duration', value: lead.answers.duration },
                                            ].map((item, idx) => item.value ? (
                                                <div key={idx}>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                                                    <p className="text-sm font-bold text-slate-900">{String(item.value)}</p>
                                                </div>
                                            ) : null)}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Customer Details (from specialized 'details' object) */}
                                {lead.answers.details && (
                                    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 mb-6">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                            <ChevronRight size={10} />
                                            Customer Information
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(lead.answers.details).map(([key, value]) => {
                                                const hiddenKeys = ['ip', 'mac', 'userAgent', 'fingerprint', 'ipAddress'];
                                                if (hiddenKeys.includes(key.toLowerCase())) return null;
                                                
                                                return (
                                                    <div key={key}>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900">{String(value)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Cart / Order Items */}
                                {lead.answers.cart && Array.isArray(lead.answers.cart) && (
                                    <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100/50 mb-6">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                            <ChevronRight size={10} />
                                            Order Items ({lead.answers.totalItems || lead.answers.cart.length})
                                        </p>
                                        <div className="space-y-3">
                                            {lead.answers.cart.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                            {item.quantity}x
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">
                                                        {lead.answers.currency || '₦'}{Number(item.total || item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                                                <span className="text-xs font-black text-slate-400 uppercase">Total Amount</span>
                                                <span className="text-lg font-black text-blue-600">
                                                    {lead.answers.currency || '₦'}{Number(lead.answers.totalPrice).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 4. Standard Form Fields / Additional Answers */}
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Map actual form fields first */}
                                    {lead.form.fields.map((field) => {
                                        const answer = lead.answers[field.id];
                                        // Skip if it's already shown in details or if it's empty
                                        if (!answer || typeof answer === 'object') return null;
                                        
                                        return (
                                            <div key={field.id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100/50">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <ChevronRight size={10} />
                                                    {field.label}
                                                </p>
                                                <p className="text-sm font-bold text-slate-900">{String(answer)}</p>
                                            </div>
                                        );
                                    })}

                                    {/* Map any other key-value pairs in answers that aren't internal types or already shown */}
                                    {Object.entries(lead.answers).map(([key, value]) => {
                                        const internalKeys = [
                                            'cart', 'details', 'type', 'currency', 
                                            'totalItems', 'totalPrice', 'note', 
                                            'tableNumber', 'ip', 'userAgent', 
                                            'fingerprint', 'browser', 'device', 'os',
                                            'mac', 'ipAddress', 'serviceTitle', 'date', 'time',
                                            'price', 'duration', 'businessName', 'destinationMode', 'bookingUrl'
                                        ];
                                        const isFormField = lead.form.fields.some(f => f.id === key);
                                        
                                        if (internalKeys.includes(key) || isFormField || typeof value === 'object') return null;
                                        
                                        return (
                                            <div key={key} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100/50">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <ChevronRight size={10} />
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </p>
                                                <p className="text-sm font-bold text-slate-900">{String(value)}</p>
                                            </div>
                                        );
                                    })}

                                    {/* Note Section */}
                                    {lead.answers.note && (
                                        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/50">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <ChevronRight size={10} />
                                                Additional Note
                                            </p>
                                            <p className="text-sm font-medium text-slate-700 italic">"{lead.answers.note}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Status Actions */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                {(lead.localStatus || 'new') === 'new' && (
                                    <button 
                                        className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50" 
                                        onClick={() => handleStatusUpdate('processing')}
                                        disabled={updateStatus.isPending}
                                    >
                                        {updateStatus.isPending ? <Loader2 className="animate-spin" size={18}/> : <Clock size={18}/>}
                                        Start Processing
                                    </button>
                                )}
                                {lead.localStatus === 'processing' && (
                                    <button 
                                        className="flex-1 h-12 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50" 
                                        onClick={() => handleStatusUpdate('completed')}
                                        disabled={updateStatus.isPending}
                                    >
                                        {updateStatus.isPending ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                                        Mark as Completed
                                    </button>
                                )}
                                {((lead.localStatus || 'new') === 'new' || lead.localStatus === 'processing') && (
                                    <button 
                                        className="px-6 h-12 bg-white border border-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        disabled={updateStatus.isPending}
                                    >
                                        <XCircle size={18}/>
                                        Cancel
                                    </button>
                                )}
                                {(['completed', 'cancelled'].includes(lead.localStatus || '')) && (
                                    <button 
                                        className="flex-1 h-12 bg-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        onClick={() => handleStatusUpdate('new')}
                                        disabled={updateStatus.isPending}
                                    >
                                        <Clock size={18}/>
                                        Re-open Lead
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                                Close Details
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
