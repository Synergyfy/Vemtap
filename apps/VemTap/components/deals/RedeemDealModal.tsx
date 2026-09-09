'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Phone, MapPin, ExternalLink } from 'lucide-react';

interface RedeemDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deal: any;
    onChat?: () => void;
}

export default function RedeemDealModal({ isOpen, onClose, deal, onChat }: RedeemDealModalProps) {
    const businessPhone = deal?.businessPhone || '+2348012345678';
    const businessName = deal?.businessName || 'Business';
    const dealTitle = deal?.title || 'this deal';
    const portalRoot = typeof document !== 'undefined' ? document.body : null;

    const prefilledMessage = encodeURIComponent(
        `Hi ${businessName}! I just claimed your deal "${dealTitle}" on VemTap. I'd like to arrange how to redeem it. `
    );

    const handleWhatsApp = () => {
        window.open(`https://wa.me/${businessPhone.replace(/[^0-9]/g, '')}?text=${prefilledMessage}`, '_blank');
    };

    const handleCall = () => {
        window.open(`tel:${businessPhone}`, '_self');
    };

    const handleDirections = () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`, '_blank');
    };

    if (!isOpen || !portalRoot) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div
                className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden"
            >
                {/* Handle (mobile) */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-[17px] font-bold text-gray-900">Redeem Deal</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">How would you like to connect?</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                    {/* In-App Chat */}
                    <button
                        onClick={() => { onChat?.(); onClose(); }}
                        className="w-full flex items-center gap-4 p-4 bg-[#f0f6ff] rounded-xl hover:bg-[#e0ecff] transition-colors active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-[#0055c4] rounded-full flex items-center justify-center shrink-0">
                            <MessageCircle size={22} className="text-white" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[14px] font-semibold text-gray-900">Chat with {businessName}</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">Send a message directly in VemTap</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400" />
                    </button>

                    {/* WhatsApp */}
                    <button
                        onClick={handleWhatsApp}
                        className="w-full flex items-center gap-4 p-4 bg-[#f0fdf4] rounded-xl hover:bg-[#dcfce7] transition-colors active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-[#25d366] rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-[18px]">W</span>
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[14px] font-semibold text-gray-900">WhatsApp</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">Click to chat on WhatsApp</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400" />
                    </button>

                    {/* Click to Call */}
                    <button
                        onClick={handleCall}
                        className="w-full flex items-center gap-4 p-4 bg-[#fefce8] rounded-xl hover:bg-[#fef9c3] transition-colors active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-[#eab308] rounded-full flex items-center justify-center shrink-0">
                            <Phone size={22} className="text-white" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[14px] font-semibold text-gray-900">Click to Call</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">{businessPhone}</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400" />
                    </button>

                    {/* Visit Store */}
                    <button
                        onClick={handleDirections}
                        className="w-full flex items-center gap-4 p-4 bg-[#fdf2f8] rounded-xl hover:bg-[#fce7f3] transition-colors active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-[#ec4899] rounded-full flex items-center justify-center shrink-0">
                            <MapPin size={22} className="text-white" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[14px] font-semibold text-gray-900">Visit Store</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">Get directions on Google Maps</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400" />
                    </button>
                </div>

                {/* Prefilled Message Preview */}
                <div className="px-5 pb-5">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prefilled Message</p>
                        <p className="text-[13px] text-gray-600 leading-relaxed">
                            Hi {businessName}! I just claimed your deal &quot;{dealTitle}&quot; on VemTap. I&apos;d like to arrange how to redeem it. (Coming to store / Send dispatch / Schedule visit)
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
}
