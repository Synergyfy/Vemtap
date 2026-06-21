import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Palette, QrCode } from 'lucide-react';
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
    const qrUrl = `https://vemtap.com/menu/${businessCode}`;
    const qrRef = useRef<HTMLDivElement>(null);

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
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Your Menu QR</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Scan to view catalogue</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* QR Code Area */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-[2rem] p-8 mb-8 border border-gray-100">
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

                        {/* Actions */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <Button onClick={() => handleDownload('png')} variant="outline" className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    PNG
                                </Button>
                                <Button onClick={() => handleDownload('jpeg')} variant="outline" className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    JPEG
                                </Button>
                                <Button onClick={() => handleDownload('png')} variant="outline" className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    SVG
                                </Button>
                            </div>
                            
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-gray-100"></div>
                                <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">or</span>
                                <div className="flex-grow border-t border-gray-100"></div>
                            </div>

                            <Link href={`/dashboard/marketing-assets?qrUrl=${encodeURIComponent(qrUrl)}`} onClick={onClose} className="block w-full">
                                <Button className="w-full h-14 rounded-2xl bg-[#066CF4] hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transition-all">
                                    <Palette className="mr-2" size={18} />
                                    Design Your QR
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
