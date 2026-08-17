'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, QrCode, ExternalLink, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

interface PublicPosModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    businessName: string;
    logoUrl?: string;
}

type View = 'menu' | 'qr';

export default function PublicPosModal({ isOpen, onClose, url, businessName, logoUrl }: PublicPosModalProps) {
    const qrRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<View>('menu');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePreview = () => {
        window.open(url, '_blank');
        onClose();
    };

    const handleDownloadQR = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `POS-QR-${businessName.replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClose = () => {
        setView('menu');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[32px] p-6 md:p-8 shadow-2xl z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-gray-900">
                                    {view === 'qr' ? 'Scan to Order' : 'Public POS'}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {view === 'qr' ? 'QR Code' : 'Share your store'}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="size-9 md:size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {view === 'menu' && (
                            <div className="space-y-2">
                                {/* Copy Link */}
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left group"
                                >
                                    <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        {copied ? <Check size={18} /> : <Link2 size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">Copy Link</p>
                                        <p className="text-[10px] font-medium text-gray-400 truncate">{url}</p>
                                    </div>
                                </button>

                                {/* QR Code */}
                                <button
                                    onClick={() => setView('qr')}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left group"
                                >
                                    <div className="size-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <QrCode size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">QR Code</p>
                                        <p className="text-[10px] font-medium text-gray-400">Download or print for your counter</p>
                                    </div>
                                </button>

                                {/* Preview */}
                                <button
                                    onClick={handlePreview}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left group"
                                >
                                    <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <ExternalLink size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">Preview</p>
                                        <p className="text-[10px] font-medium text-gray-400">See what your customers see</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {view === 'qr' && (
                            <div className="flex flex-col items-center">
                                <div className="bg-gray-50 rounded-[2rem] p-6 md:p-8 mb-6 border border-gray-100 w-full flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4" ref={qrRef}>
                                        <QRCodeCanvas
                                            value={url}
                                            size={180}
                                            level="H"
                                            includeMargin={false}
                                            imageSettings={logoUrl ? {
                                                src: logoUrl,
                                                height: 40,
                                                width: 40,
                                                excavate: true,
                                            } : undefined}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center max-w-[200px] truncate">
                                        {url}
                                    </p>
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setView('menu')}
                                        className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleDownloadQR}
                                        className="flex-1 h-12 rounded-2xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition-colors"
                                    >
                                        Download PNG
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
