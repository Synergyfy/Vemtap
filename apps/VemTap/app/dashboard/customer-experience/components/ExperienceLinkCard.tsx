'use client';

import React, { useRef } from 'react';
import { Copy, Download, Link2, CheckCircle2, Loader2 } from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { useMainQrCode } from '@/services/qr-thrive/hooks';
import { QrPreview } from '@/app/dashboard/explore-qrthrive/components/QrPreview';
import { DEFAULT_QR_DESIGN } from '@/services/qr-thrive/types';

interface ExperienceLinkCardProps {
    publicUrl: string;
    qrUrl?: string;
    businessLogo?: string;
    branchId?: string;
    forceDeviceQr?: boolean;
    businessName?: string;
    branchName?: string;
}

export function ExperienceLinkCard({ publicUrl, qrUrl, businessLogo, branchId, forceDeviceQr, businessName, branchName }: ExperienceLinkCardProps) {
    const [copied, setCopied] = React.useState(false);
    const qrRef = useRef<any>(null);

    const { data: mainQrData, isLoading: isLoadingMainQr, isFetched } = useMainQrCode(
        !forceDeviceQr && branchId && branchId !== 'all' ? branchId : null
    );

    const mainQrCode = mainQrData?.qrCode;
    const hasMainQr = !forceDeviceQr && !!mainQrCode;
    const showFallbackQr = forceDeviceQr || (!hasMainQr && !isLoadingMainQr && !isFetched);

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const getDownloadFileName = (extension: string) => {
        const parts = [];
        if (businessName) parts.push(businessName);
        if (branchName) parts.push(branchName);
        if (parts.length === 0) parts.push('business-experience-qr');
        
        const baseName = parts.join('-')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/gi, '_')
            .replace(/__+/g, '_');
            
        return `${baseName}.${extension}`;
    };

    const handleDownload = (format: 'png' | 'svg') => {
        const fileName = getDownloadFileName(format);
        const nameWithoutExt = getDownloadFileName(format).replace(`.${format}`, '');

        if (hasMainQr && qrRef.current) {
            qrRef.current.download({
                name: nameWithoutExt,
                extension: format,
                width: 1024,
                height: 1024,
            });
            toast.success(`${format.toUpperCase()} download started!`);
            return;
        }

        if (format === 'png') {
            const canvas = document.getElementById('experience-qr') as HTMLCanvasElement;
            if (!canvas) return;

            try {
                const url = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = fileName;
                link.href = url;
                link.click();
                toast.success('PNG downloaded!');
            } catch (err) {
                console.error('QR PNG Download failed:', err);
                toast.error('Download failed. Cross-origin logo issue or disabled canvas.');
            }
        } else {
            const svgEl = document.getElementById('experience-qr-svg');
            if (!svgEl) return;

            try {
                const svgString = new XMLSerializer().serializeToString(svgEl);
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = svgUrl;
                link.click();
                toast.success('SVG downloaded!');
            } catch (err) {
                console.error('QR SVG Download failed:', err);
                toast.error('SVG download failed.');
            }
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
                    {(hasMainQr || showFallbackQr) && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleDownload('png')}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors border border-primary/10"
                            >
                                <Download size={14} />
                                PNG (1024x1024)
                            </button>
                            <button
                                onClick={() => handleDownload('svg')}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors border border-primary/10"
                            >
                                <Download size={14} />
                                SVG
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Code */}
            {hasMainQr || showFallbackQr ? (
                <div className="w-28 h-28 bg-white p-2 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    {isLoadingMainQr ? (
                        <Loader2 size={20} className="text-gray-300 animate-spin" />
                    ) : hasMainQr ? (
                        <div className="scale-[0.38] transform-gpu origin-center">
                            <QrPreview
                                data={qrUrl || mainQrCode.data?.url || publicUrl}
                                design={mainQrCode.design || DEFAULT_QR_DESIGN}
                                frame={mainQrCode.frame || { type: 'none' }}
                                logo={mainQrCode.logo}
                                width={180}
                                height={180}
                                onReady={(inst) => { qrRef.current = inst; }}
                            />
                        </div>
                    ) : (
                        <>
                            <QRCodeCanvas
                                id="experience-qr"
                                value={qrUrl || publicUrl}
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
                            <div style={{ display: 'none' }}>
                                <QRCodeSVG
                                    id="experience-qr-svg"
                                    value={qrUrl || publicUrl}
                                    size={1024}
                                    level="H"
                                    includeMargin={false}
                                    imageSettings={businessLogo ? {
                                        src: businessLogo,
                                        height: 256,
                                        width: 256,
                                        excavate: true,
                                    } : undefined}
                                />
                            </div>
                        </>
                    )}
                </div>
            ) : null}
        </div>
    );
}
