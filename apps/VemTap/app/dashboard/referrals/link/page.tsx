"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Copy, Share2, ExternalLink, QrCode, 
    Download, ArrowLeft, Check, Sparkles 
} from 'lucide-react';
import { useReferralStore } from '@/store/useReferralStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function ReferralLinkPage() {
    const { referralLink, generateLink } = useReferralStore();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success('Referral link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="pb-32 md:pb-20 max-w-2xl mx-auto p-4 md:p-8 space-y-12">
            <Link href="/dashboard/referrals" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Dashboard
            </Link>

            <div className="text-center md:text-left mb-12">
                <div className="flex items-center gap-2"><h1 className="text-3xl font-bold text-gray-900 leading-tight">My Referral Link</h1><PageGuideButton /><AICopilotButton /></div>
                <p className="text-sm font-medium text-gray-500 mt-1">Share your unique link and earn commissions.</p>
            </div>

            {/* LINK CARD */}
            <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <Badge className="bg-blue-50 text-[#066CF4] border-none font-bold text-[10px] uppercase px-3 py-1">Unique Link</Badge>
                    <button onClick={generateLink} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#066CF4]">Regenerate</button>
                </div>
                
                <div className="h-20 bg-gray-50 rounded-2xl flex items-center justify-between px-6 mb-8 border border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{referralLink}</p>
                    <Button onClick={handleCopy} variant="ghost" className="rounded-xl">
                        {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button className="h-14 rounded-2xl bg-[#066CF4] text-white font-bold uppercase tracking-wider text-[10px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                        <Share2 size={16} className="mr-2" /> Share Link
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-gray-100 font-bold text-[10px] uppercase tracking-wider text-gray-400">
                        <ExternalLink size={16} className="mr-2" /> Open Link
                    </Button>
                </div>
            </div>

            {/* QR CARD */}
            <div className="rounded-2xl bg-gray-900 p-10 text-white shadow-xl flex flex-col items-center text-center">
                <h3 className="text-lg font-bold mb-6">Referral QR Code</h3>
                <div className="size-48 bg-white rounded-3xl p-4 mb-8">
                   <QrCode className="size-full text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                   <Button variant="outline" className="rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10">Download QR</Button>
                   <Button variant="outline" className="rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10">Print QR</Button>
                </div>
            </div>
        </div>
    );
}
