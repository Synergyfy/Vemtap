'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { MessageSquare, Globe, ArrowRight, MessageCircle, Mail, Smartphone } from 'lucide-react';

interface MessagingChannelSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectInApp: () => void;
    onSelectExternal: () => void;
    recipientName: string;
}

export default function MessagingChannelSelectorModal({
    isOpen,
    onClose,
    onSelectInApp,
    onSelectExternal,
    recipientName
}: MessagingChannelSelectorModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="How would you like to message?"
            description={`Choose a channel to contact ${recipientName}`}
            size="lg"
        >
            <div className="grid grid-cols-1 gap-4 py-4">
                <button
                    onClick={onSelectInApp}
                    className="group relative flex items-center gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left overflow-hidden shadow-sm"
                >
                    <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                        <MessageSquare size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">In-App Chat</h3>
                        <p className="text-sm text-slate-500">Chat directly within the VemTap platform</p>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    
                    {/* Decorative element */}
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MessageSquare size={80} />
                    </div>
                </button>

                <button
                    onClick={onSelectExternal}
                    className="group relative flex items-center gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left overflow-hidden shadow-sm"
                >
                    <div className="size-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                        <Globe size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">External Channels</h3>
                        <p className="text-sm text-slate-500 font-medium">WhatsApp, SMS, or Email</p>
                        <div className="flex items-center gap-3 mt-2">
                             <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                <MessageCircle size={10} /> WhatsApp
                             </div>
                             <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                <Smartphone size={10} /> SMS
                             </div>
                             <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                <Mail size={10} /> Email
                             </div>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                    
                    {/* Decorative element */}
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Globe size={80} />
                    </div>
                </button>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    <span className="font-bold text-slate-700">Tip:</span> Use In-App Chat for real-time support if the visitor is currently on your site, or external channels to reach them directly on their personal devices.
                </p>
            </div>
        </Modal>
    );
}
