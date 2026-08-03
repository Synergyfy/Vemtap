'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserPlus, X, Copy, CheckCheck, Download, QrCode, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import { useAffiliateStats } from '@/services/affiliates/hooks';
import PartnershipVerificationGuard from '@/components/dashboard/partnership/PartnershipVerificationGuard';

export default function BusinessPartnershipLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isOverview = pathname === '/dashboard/business-partnership';
    const [inviteOpen, setInviteOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const { data: stats } = useAffiliateStats();
    const referralLink = `https://vemtap.com/get-started?ref=${stats?.referralCode || ''}`;

    const handleCopy = (key: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const shareChannels = [
        { label: 'WhatsApp', icon: '/icons/whatsapp.svg', color: 'bg-green-500' },
        { label: 'Facebook', icon: '/icons/facebook.svg', color: 'bg-blue-600' },
        { label: 'LinkedIn', icon: '/icons/linkedin.svg', color: 'bg-blue-700' },
        { label: 'Telegram', icon: '/icons/telegram.svg', color: 'bg-sky-500' },
        { label: 'Email', icon: '/icons/email.svg', color: 'bg-gray-500' },
    ];

    return (
        <PageLockWrapper feature="discovery" featureName="Business Partnership" hideUsage>
            <div className="relative flex flex-col gap-5 md:gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-10">
                {/* Page Header */}
                <div className="flex items-start gap-3">
                    {!isOverview && (
                        <Link
                            href="/dashboard/business-partnership"
                            className="size-9 md:size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all shrink-0 mt-0.5"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                    )}
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Business Partnership</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Invite businesses, earn rewards, and grow your network</p>
                    </div>
                </div>

                {children}


                {/* Floating Action Button */}
                <button
                    onClick={() => setInviteOpen(true)}
                    className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-40 size-12 md:size-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                    <UserPlus size={22} />
                </button>

                {/* Invite Business Modal */}
                <AnimatePresence>
                    {inviteOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setInviteOpen(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]"
                            >
                                <div className="p-5 md:p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4 md:mb-6">
                                        <div>
                                            <h2 className="text-base md:text-xl font-bold text-gray-900">Invite a Business</h2>
                                            <p className="text-xs md:text-sm text-gray-500 mt-1">Share your referral link and earn rewards</p>
                                        </div>
                                        <button onClick={() => setInviteOpen(false)} className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 ml-3">
                                            <X size={16} className="text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Referral Link */}
                                    <div className="bg-gray-50 rounded-2xl p-4 mb-4 md:mb-6">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Your Referral Link</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-[11px] md:text-sm font-medium text-gray-700 truncate">
                                                {referralLink}
                                            </div>
                                            <button
                                                onClick={() => handleCopy('modal-link', referralLink)}
                                                className="size-11 md:size-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all shrink-0"
                                            >
                                                {copied === 'modal-link' ? <CheckCheck size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    <div className="flex items-center justify-center mb-4 md:mb-6">
                                        <div className="bg-white rounded-2xl border border-gray-100 p-3 md:p-4 shadow-sm">
                                            <QRCodeSVG value={referralLink} size={120} />
                                        </div>
                                    </div>

                                    {/* Share Buttons */}
                                    <div className="space-y-2.5 md:space-y-3">
                                        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Share via</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                                            {shareChannels.map((channel) => (
                                                <button
                                                    key={channel.label}
                                                    className="flex flex-col items-center gap-1.5 md:gap-2 p-2.5 md:p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className={cn("size-9 md:size-10 rounded-full flex items-center justify-center", channel.color)}>
                                                        <span className="text-white text-[11px] md:text-xs font-bold">{channel.label[0]}</span>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-gray-500">{channel.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Download Options */}
                                    <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-gray-100 grid grid-cols-2 gap-2 md:gap-3">
                                        <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <Download size={14} className="text-primary shrink-0" />
                                            <span className="text-xs md:text-sm font-medium text-gray-700">Download QR</span>
                                        </button>
                                        <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <Download size={14} className="text-primary shrink-0" />
                                            <span className="text-xs md:text-sm font-medium text-gray-700">Download Card</span>
                                        </button>
                                        <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors col-span-2">
                                            <QrCode size={14} className="text-primary shrink-0" />
                                            <span className="text-xs md:text-sm font-medium text-gray-700">Generate Flyer</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PageLockWrapper>
    );
}
