'use client';

import React, { useState } from 'react';
import { Copy, Download, Link2, CheckCircle2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';

interface ExperienceLinkCardProps {
    publicUrl: string;
    businessLogo?: string;
}

export function ExperienceLinkCard({ publicUrl, businessLogo }: ExperienceLinkCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById('experience-qr') as HTMLCanvasElement;
        if (!canvas) return;
        
        try {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'business-experience-qr.png';
            link.href = url;
            link.click();
            toast.success('QR Code downloaded!');
        } catch (err) {
            console.error('QR Download failed:', err);
            toast.error('Download failed. Cross-origin logo issue or disabled canvas.');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row items-center gap-5">
            {/* Link Section */}
            <div className="flex-1 w-full min-w-0">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2 block">
                    Experience Link
                </label>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <Link2 size={16} className="text-primary shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 truncate">{publicUrl}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                    >
                        {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                        onClick={handleDownloadQR}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                    >
                        <Download size={14} />
                        Download QR
                    </button>
                </div>
            </div>

            {/* QR Code */}
            <div className="w-28 h-28 bg-white p-2 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <QRCodeCanvas
                    id="experience-qr"
                    value={publicUrl}
                    size={1024}
                    level="H"
                    includeMargin={false}
                    style={{ width: 96, height: 96 }}
                    imageSettings={businessLogo ? {
                        src: businessLogo,
                        height: 256,
                        width: 256,
                        excavate: true,
                        crossOrigin: 'anonymous',
                    } : undefined}
                />
            </div>
        </div>
    );
}
