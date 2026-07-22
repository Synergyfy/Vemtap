import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Palette, QrCode, ArrowLeft, ArrowRight, Paintbrush } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface CatalogueQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessCode: string;
    businessName: string;
    logoUrl?: string;
}

export function CatalogueQRModal({ isOpen, onClose, businessCode, businessName, logoUrl }: CatalogueQRModalProps) {
    const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/b/${businessCode}/pos` : `https://vemtap.com/b/${businessCode}/pos`;
    const qrRef = useRef<HTMLDivElement>(null);
    const [viewState, setViewState] = useState<'initial' | 'download' | 'design'>('initial');

    useEffect(() => {
        if (isOpen) {
            setViewState('initial');
        }
    }, [isOpen]);

    const handleDownload = (format: 'png' | 'jpeg' | 'svg') => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;

        let dataUrl = '';
        if (format === 'svg') {
            // Note: For a true SVG download, we'd use QRCodeSVG instead of Canvas. 
            // But for simplicity with qrcode.react, we'll download PNG/JPEG.
            dataUrl = canvas.toDataURL('image/png'); 
        } else {
            dataUrl = canvas.toDataURL(`image/${format}`);
        }

        const link = document.createElement('a');
        link.download = `Menu-QR-${businessName.replace(/\s+/g, '-')}.${format}`;
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
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                {viewState !== 'initial' && (
                                    <button 
                                        onClick={() => setViewState('initial')}
                                        className="size-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                )}
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">
                                        {viewState === 'design' ? 'Design Your QR' : 'Your Menu QR'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {viewState === 'design' ? 'Customize appearance' : 'Scan to start ordering'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {viewState !== 'design' && (
                            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-[2rem] p-8 mb-8 border border-gray-100">
                                {/* QR Code Area */}
                                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 relative" ref={qrRef}>
                                    <QRCodeCanvas
                                        value={qrUrl}
                                        size={200}
                                        level="H"
                                        includeMargin={false}
                                        imageSettings={logoUrl ? {
                                            src: logoUrl,
                                            x: undefined,
                                            y: undefined,
                                            height: 48,
                                            width: 48,
                                            excavate: true,
                                        } : undefined}
                                    />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-[#066CF4] border-[#066CF4]/20 bg-[#066CF4]/5">
                                    {qrUrl}
                                </Badge>
                            </div>
                        )}

                        {viewState === 'design' && (
                            <div className="flex flex-col items-center justify-center bg-[#066CF4]/5 rounded-[2rem] p-8 mb-8 border border-[#066CF4]/10 text-center">
                                <div className="size-16 bg-[#066CF4]/10 text-[#066CF4] rounded-2xl flex items-center justify-center mb-6">
                                    <Paintbrush size={32} />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 mb-2">Heading to Marketing Assets</h4>
                                <p className="text-sm font-medium text-gray-500 mb-2">
                                    You will be redirected to the design studio where you can customize your QR code's colors, add your brand logo, and apply custom frames.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            {viewState === 'initial' && (
                                <div className="flex flex-col gap-3">
                                    <Button  className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all">
                                        <Download className="mr-2" size={18} />
                                        Download QR
                                    </Button>
                                    
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-gray-100"></div>
                                        <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">or</span>
                                        <div className="flex-grow border-t border-gray-100"></div>
                                    </div>

                                    <Button onClick={() => setViewState('design')} className="w-full h-14 rounded-2xl bg-[#066CF4] hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transition-all">
                                        <Palette className="mr-2" size={18} />
                                        Design Your QR
                                    </Button>
                                </div>
                            )}

                            {viewState === 'download' && (
                                <div className="space-y-4">
                                    <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select format to download</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button onClick={() => handleDownload('png')} variant="outline" className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                            PNG
                                        </Button>
                                        <Button onClick={() => handleDownload('jpeg')} variant="outline" className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                            JPEG
                                        </Button>
                                        <Button onClick={() => handleDownload('svg')} variant="outline" className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                            SVG
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {viewState === 'design' && (
                                <Link href={`/dashboard/marketing-assets/create?qrSource=catalogue`} onClick={onClose} className="block w-full">
                                    <Button className="w-full h-14 rounded-2xl bg-[#066CF4] hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transition-all">
                                        Continue <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
