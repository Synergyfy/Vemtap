'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';

interface PosQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    businessName: string;
    logoUrl?: string;
}

export default function PosQRModal({ isOpen, onClose, url, businessName, logoUrl }: PosQRModalProps) {
    const qrRef = useRef<HTMLDivElement>(null);
    const [showFormats, setShowFormats] = useState(false);

    const handleDownload = (format: 'png' | 'jpeg' | 'svg') => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;

        const dataUrl = canvas.toDataURL(format === 'svg' ? 'image/png' : `image/${format}`);
        const link = document.createElement('a');
        link.download = `POS-QR-${businessName.replace(/\s+/g, '-')}.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
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
                                <h3 className="text-lg md:text-xl font-black text-gray-900">Public POS QR</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    Customers scan to order
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="size-9 md:size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center bg-gray-50 rounded-[2rem] p-6 md:p-8 mb-6 border border-gray-100">
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

                        {/* Download Actions */}
                        {!showFormats ? (
                            <Button
                                onClick={() => setShowFormats(true)}
                                className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl transition-all"
                            >
                                <Download className="mr-2" size={16} />
                                Download QR
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select format</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button onClick={() => handleDownload('png')} variant="outline" className="rounded-xl h-11 md:h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        PNG
                                    </Button>
                                    <Button onClick={() => handleDownload('jpeg')} variant="outline" className="rounded-xl h-11 md:h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        JPEG
                                    </Button>
                                    <Button onClick={() => handleDownload('svg')} variant="outline" className="rounded-xl h-11 md:h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        SVG
                                    </Button>
                                </div>
                                <button
                                    onClick={() => setShowFormats(false)}
                                    className="w-full text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-1 hover:text-gray-600 transition-colors"
                                >
                                    Back
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
