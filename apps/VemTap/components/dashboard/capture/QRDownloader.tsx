'use client';

import React from 'react';
import { 
    Download, Share2, FileDown, Printer, Smartphone, 
    Mail, MessageCircle, Instagram, Facebook, Copy,
    CheckCircle2, ArrowRight
} from 'lucide-react';
import { useCustomerCaptureStore } from '@/store/useCustomerCaptureStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function QRDownloader() {
    const { shortLink, setStep } = useCustomerCaptureStore();

    const handleDownload = (format: string) => {
        toast.success(`Download started: QR_Code.${format.toLowerCase()}`);
    };

    const handleShare = (platform: string) => {
        toast.success(`Sharing to ${platform}...`);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shortLink);
        toast.success('Link copied!');
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Download Your QR Code</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">Choose how you want to use and deploy your QR code.</p>
            </div>

            {/* Download Formats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-[#066CF4]/20 transition-all">
                    <div className="mb-4 p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-[#066CF4] group-hover:text-white transition-all">
                        <FileDown size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">PNG Format</h3>
                    <p className="mb-6 text-xs font-medium text-gray-500">High resolution, transparent background. Best for digital use.</p>
                    <Button onClick={() => handleDownload('PNG')} className="w-full h-12 rounded-xl bg-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-[#066CF4]">
                        Download PNG
                    </Button>
                </div>

                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-[#066CF4]/20 transition-all">
                    <div className="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <Printer size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">PDF Format</h3>
                    <p className="mb-6 text-xs font-medium text-gray-500">Print-ready vector format. Maintains quality at any size.</p>
                    <Button onClick={() => handleDownload('PDF')} className="w-full h-12 rounded-xl bg-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600">
                        Download PDF
                    </Button>
                </div>

                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-[#066CF4]/20 transition-all md:col-span-2">
                    <div className="mb-4 p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Smartphone size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Vemtap Print Package</h3>
                    <p className="mb-6 text-xs font-medium text-gray-500 max-w-sm">Includes high-quality templates for posters, table tents, flyers, and counter displays.</p>
                    <Button onClick={() => handleDownload('Package')} className="w-full max-w-xs h-12 rounded-xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        Download Print Package
                    </Button>
                </div>
            </div>

            {/* Share Options */}
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="mb-6 text-sm font-black text-gray-900 uppercase tracking-widest text-center">Share Short Link</h3>
                <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-50 text-green-600' },
                        { icon: Mail, label: 'Email', color: 'bg-blue-50 text-blue-600' },
                        { icon: Instagram, label: 'Instagram', color: 'bg-pink-50 text-pink-600' },
                        { icon: Facebook, label: 'Facebook', color: 'bg-indigo-50 text-indigo-600' },
                        { icon: Copy, label: 'Copy', color: 'bg-gray-50 text-gray-600', action: handleCopy },
                    ].map((item) => (
                        <button 
                            key={item.label}
                            onClick={item.action || (() => handleShare(item.label))}
                            className="flex flex-col items-center gap-2 min-w-[72px]"
                        >
                            <div className={`size-14 rounded-2xl ${item.color} flex items-center justify-center shadow-sm active:scale-90 transition-all`}>
                                <item.icon size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Deployment Tips */}
            <div className="rounded-[32px] bg-blue-50/50 p-8 border border-blue-100">
                <h3 className="mb-4 text-sm font-black text-[#066CF4] uppercase tracking-widest">QR Deployment Tips</h3>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        'Entrance', 'Counter', 'Tables', 
                        'Reception', 'Packaging', 'Waiting Area'
                    ].map((tip) => (
                        <div key={tip} className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#066CF4]" />
                            <span className="text-xs font-bold text-gray-700">{tip}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 flex gap-4">
                <Button 
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                    Back
                </Button>
                <Button 
                    onClick={() => setStep(4)}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20"
                >
                    Setup Registration Form
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
