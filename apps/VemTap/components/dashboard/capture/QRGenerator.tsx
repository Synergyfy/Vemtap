'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    QrCode, Copy, Share2, ExternalLink, RefreshCw, 
    Calendar, Users, Info, ArrowRight, Check 
} from 'lucide-react';
import { useCustomerCaptureStore } from '@/store/useCustomerCaptureStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRGenerator() {
    const { setShortLink, shortLink, setStep } = useCustomerCaptureStore();
    const { user } = useAuthStore();
    const { data: business } = useMyBusiness();

    const businessCode = business?.uniqueCode || 'yourbusiness';
    const generatedLink = `https://vemtap.com/b/${businessCode}`;

    useEffect(() => {
        setShortLink(generatedLink);
    }, [generatedLink, setShortLink]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shortLink);
        toast.success('Link copied to clipboard!');
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Generate Customer Capture QR</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">Create a QR code customers can scan to connect with your business.</p>
            </div>

            {/* QR Generation Card */}
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-4 h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden">
                        {business?.logoUrl ? (
                            <img src={business.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                            <QrCode className="h-8 w-8 text-gray-400" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{business?.name || 'Your Business'}</h2>
                    <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-600 border-none px-3 py-0.5 text-[10px] font-black uppercase">
                        {(typeof business?.category === 'string' ? business.category : (business?.category as any)?.name) || 'Business'}
                    </Badge>
                </div>

                {/* QR Preview Container */}
                <div className="relative mb-8 rounded-[40px] bg-white p-8 shadow-2xl shadow-black/5 border border-gray-50 flex flex-col items-center">
                    <div className="h-48 w-48 flex items-center justify-center">
                        <QRCodeCanvas 
                            value={shortLink} 
                            size={192}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                        <Button variant="outline" size="sm" className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100">
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100">
                            Regenerate
                        </Button>
                    </div>

                    <div className="absolute -right-4 -top-4 p-3 bg-[#066CF4] text-white rounded-2xl shadow-lg">
                        <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase">
                            Customer Capture QR
                        </Badge>
                    </div>
                </div>

                {/* QR Status Info */}
                <div className="grid grid-cols-3 gap-4 w-full">
                    <div className="text-center">
                        <div className="text-xs font-black text-emerald-500 uppercase tracking-widest">Active</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Status</div>
                    </div>
                    <div className="text-center border-x border-gray-100">
                        <div className="text-xs font-black text-gray-900 uppercase tracking-widest">0</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Scans</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-black text-gray-900 uppercase tracking-widest">0</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Signups</div>
                    </div>
                </div>
            </div>

            {/* Short Link Card */}
            <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Short Link</h3>
                    <Badge variant="outline" className="text-[9px] font-bold border-emerald-100 text-emerald-600 bg-emerald-50">Auto-Generated</Badge>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex-1 px-4 text-sm font-bold text-gray-600 truncate">
                        {shortLink}
                    </div>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleCopyLink}
                        className="h-10 w-10 rounded-xl bg-white text-gray-600 shadow-sm border border-gray-100"
                    >
                        <Copy size={16} />
                    </Button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-600">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                    <Button variant="outline" className="h-12 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-600">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Link
                    </Button>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 flex gap-4">
                <Button 
                    variant="ghost"
                    onClick={() => setStep(0)} // Navigate back to list or dashboard
                    className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                    Back
                </Button>
                <Button 
                    onClick={() => setStep(2)}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20"
                >
                    Continue to Customize
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
