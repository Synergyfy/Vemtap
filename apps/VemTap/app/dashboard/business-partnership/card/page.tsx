'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, Copy, CheckCheck, Smartphone, Monitor, ExternalLink, Palette, ChevronDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useAffiliateStats } from '@/services/affiliates/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { CardFlip, CardDesignPreview, cardLayouts, MiniLayoutPreview, faceComponents, type BusinessInfo, type CardLayoutId } from './BusinessCardPreview';

const presetColors = [
    { hex: '#066CF4', label: 'Default Blue' },
    { hex: '#0F172A', label: 'Dark' },
    { hex: '#059669', label: 'Green' },
    { hex: '#DC2626', label: 'Red' },
    { hex: '#D97706', label: 'Amber' },
    { hex: '#7C3AED', label: 'Purple' },
    { hex: '#DB2777', label: 'Pink' },
    { hex: '#0891B2', label: 'Cyan' },
    { hex: '#EA580C', label: 'Orange' },
    { hex: '#1D4ED8', label: 'Blue' },
];

const shareActions = [
    { label: 'Share Card', icon: Share2, id: 'share' },
    { label: 'Download PNG', icon: Download, id: 'download' },
    { label: 'Copy Link', icon: Copy, id: 'copy' },
    { label: 'Save to Gallery', icon: Download, id: 'save' },
] as const;

export default function PartnershipCardPage() {
    const user = useAuthStore(s => s.user);
    const { data: stats } = useAffiliateStats();
    const { data: myBusiness } = useMyBusiness();
    const { activeBranchId } = useActiveBranch();
    const { data: branches = [] } = useBranches();

    const [origin, setOrigin] = useState('');
    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);

    const activeBranch = useMemo(() => {
        return branches.find((b: any) => b.id === activeBranchId) || branches[0];
    }, [branches, activeBranchId]);

    const publicUrl = useMemo(() => {
        const base = activeBranch?.username
            ? `${origin}/${activeBranch.username}`
            : activeBranch?.uniqueCode
                ? `${origin}/${activeBranch.uniqueCode}`
                : `${origin}/your-business`;
        const ref = stats?.referralCode || 'VEN-ABC123';
        return `${base}?ref=${ref}`;
    }, [origin, activeBranch, stats]);

    const business = useMemo((): BusinessInfo => ({
        name: myBusiness?.name || user?.businessName || 'Your Business',
        category: (typeof myBusiness?.category === 'string' ? myBusiness.category : (myBusiness?.category as any)?.name) || 'Technology · Services',
        location: myBusiness?.state ? `${myBusiness.state}${myBusiness.city ? ', ' + myBusiness.city : ''}` : 'Lagos, Nigeria',
        phone: myBusiness?.phone || user?.phone || '+234 800 000 0000',
        email: myBusiness?.officialEmail || user?.email || 'business@vemtap.com',
        website: myBusiness?.website || `${(myBusiness?.name || user?.businessName || 'business').toLowerCase().replace(/\s+/g, '')}.vemtap.com`,
        partner: user?.name || 'Business Owner',
        role: 'Business Partner',
        tagline: 'Join me on VEMTAP and grow your business',
        logo: myBusiness?.logoUrl || user?.businessLogo || '/logo.png',
        referralCode: stats?.referralCode || 'VEN-ABC123',
        qrValue: publicUrl,
    }), [user, stats, myBusiness, publicUrl]);

    const [accentColor, setAccentColor] = useState('#066CF4');
    const [textDark, setTextDark] = useState('');
    const [layout, setLayout] = useState<CardLayoutId>('split-right');
    const [layoutOpen, setLayoutOpen] = useState(false);
    const [designOpen, setDesignOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [flipped, setFlipped] = useState(false);
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [previewOpen, setPreviewOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);

    const handleCopy = (label: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const captureCard = useCallback(async (): Promise<{ front: string | null; back: string | null } | null> => {
        if (!frontRef.current || !backRef.current) return null;
        try {
            const front = await toPng(frontRef.current, { quality: 1, pixelRatio: 2 });
            const back = await toPng(backRef.current, { quality: 1, pixelRatio: 2 });
            return { front, back };
        } catch {
            return null;
        }
    }, []);

    const handleShare = useCallback(async () => {
        const shareData = {
            title: business.name,
            text: `${business.name} — Join me on VEMTAP and grow your business`,
            url: business.qrValue,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {}
        } else {
            await handleCopy('share', business.qrValue);
        }
    }, [business]);

    const handleDownload = useCallback(async () => {
        const dataUrls = await captureCard();
        if (!dataUrls || !dataUrls.front || !dataUrls.back) return;
        const name = business.name.replace(/\s+/g, '-').toLowerCase();
        const link = document.createElement('a');
        link.download = `${name}-card-front.png`;
        link.href = dataUrls.front;
        link.click();
        setTimeout(() => {
            const link2 = document.createElement('a');
            link2.download = `${name}-card-back.png`;
            link2.href = dataUrls.back!;
            link2.click();
        }, 200);
    }, [captureCard, business]);

    const handleCopyLink = useCallback(() => {
        handleCopy('copy', business.qrValue);
    }, [handleCopy, business]);

    const handleSaveToGallery = useCallback(async () => {
        const dataUrls = await captureCard();
        if (!dataUrls || !dataUrls.front || !dataUrls.back) return;
        const name = business.name.replace(/\s+/g, '-').toLowerCase();
        const link = document.createElement('a');
        link.download = `${name}-card-front.png`;
        link.href = dataUrls.front;
        link.click();
        setTimeout(() => {
            const link2 = document.createElement('a');
            link2.download = `${name}-card-back.png`;
            link2.href = dataUrls.back!;
            link2.click();
        }, 200);
    }, [captureCard, business]);

    const handleAction = useCallback((id: string) => {
        switch (id) {
            case 'share': handleShare(); break;
            case 'download': handleDownload(); break;
            case 'copy': handleCopyLink(); break;
            case 'save': handleSaveToGallery(); break;
        }
    }, [handleShare, handleDownload, handleCopyLink, handleSaveToGallery]);

    const currentLayout = cardLayouts.find(l => l.id === layout)!;

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Preview + Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-4 relative">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base md:text-lg font-semibold text-gray-900">Preview</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFlipped(!flipped)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all',
                                    flipped ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'
                                )}
                            >
                                <ExternalLink size={12} />
                                <span className="hidden sm:inline">{flipped ? 'Front' : 'Back'}</span>
                            </button>
                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('mobile')}
                                    className={cn('p-2.5 rounded-md transition-all', viewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400')}
                                >
                                    <Smartphone size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode('desktop')}
                                    className={cn('p-2.5 rounded-md transition-all', viewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400')}
                                >
                                    <Monitor size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center py-4 md:py-6" ref={cardRef}>
                        <CardFlip
                            accentColor={accentColor}
                            textDark={textDark}
                            layout={layout}
                            business={business}
                            flipped={flipped}
                            onFlip={() => setFlipped(!flipped)}
                            size={viewMode === 'mobile' ? 'md' : 'lg'}
                        />
                    </div>

                    {/* Hidden flat capture containers for clean PNG export */}
                    <div className="absolute left-[-9999px] top-0 pointer-events-none" aria-hidden="true">
                        <div ref={frontRef} className="w-full max-w-[420px] aspect-[1.586/1] rounded-[20px] overflow-hidden shadow-lg">
                            {React.createElement(faceComponents.front[layout], { accent: accentColor, textDark, business })}
                        </div>
                        <div ref={backRef} className="w-full max-w-[420px] aspect-[1.586/1] rounded-[20px] overflow-hidden shadow-lg mt-4">
                            {React.createElement(faceComponents.back[layout], { accent: accentColor, textDark, business })}
                        </div>
                    </div>

                    <p className="text-center text-[11px] md:text-xs text-gray-400">
                        Tap card to flip &middot; Showing {flipped ? 'back' : 'front'} side
                    </p>

                    {/* Card Design (collapsible) */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setDesignOpen(!designOpen)}
                            className="w-full flex items-center gap-2 px-4 md:px-5 py-3.5 hover:bg-gray-50 transition-all"
                        >
                            <Palette size={16} className="text-gray-500 shrink-0" />
                            <span className="flex-1 text-left text-sm font-semibold text-gray-900">Card Design</span>
                            <div className="flex items-center gap-2">
                                {!designOpen && (
                                    <div className="hidden sm:flex items-center gap-1.5">
                                        <div className="size-4 rounded border border-gray-200" style={{ backgroundColor: accentColor }} />
                                        {textDark && <div className="size-4 rounded border border-gray-200" style={{ backgroundColor: textDark }} />}
                                    </div>
                                )}
                                <ChevronDown size={14} className={cn('text-gray-400 transition-transform shrink-0', designOpen && 'rotate-180')} />
                            </div>
                        </button>
                        {designOpen && (
                            <div className="px-4 md:px-5 pb-5 border-t border-gray-100 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Layout Selector */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-2 block">Layout Style</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setLayoutOpen(!layoutOpen)}
                                                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                                            >
                                                <MiniLayoutPreview layout={layout} accent={accentColor} />
                                                <span className="flex-1 text-left">{currentLayout.label}</span>
                                                <ChevronDown size={14} className={cn('text-gray-400 transition-transform', layoutOpen && 'rotate-180')} />
                                            </button>
                                            {layoutOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                                                    {cardLayouts.map((l) => (
                                                        <button
                                                            key={l.id}
                                                            onClick={() => { setLayout(l.id); setLayoutOpen(false); }}
                                                            className={cn(
                                                                'w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-gray-50',
                                                                layout === l.id ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-700'
                                                            )}
                                                        >
                                                            <MiniLayoutPreview layout={l.id} accent={accentColor} />
                                                            <div className="flex-1 text-left">
                                                                <span>{l.label}</span>
                                                                <p className="text-[10px] text-gray-400 font-normal">{l.desc}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Accent Color */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-2 block">Accent Color</label>
                                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                            {presetColors.map((pc) => (
                                                <button
                                                    key={pc.hex}
                                                    onClick={() => setAccentColor(pc.hex)}
                                                    className={cn(
                                                        'size-7 md:size-9 rounded-lg md:rounded-xl shrink-0 border-2 transition-all',
                                                        accentColor === pc.hex ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
                                                    )}
                                                    style={{ backgroundColor: pc.hex }}
                                                    title={pc.label}
                                                />
                                            ))}
                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    value={accentColor}
                                                    onChange={(e) => setAccentColor(e.target.value)}
                                                    className="size-7 md:size-9 rounded-lg md:rounded-xl border-2 border-gray-200 cursor-pointer"
                                                    title="Custom"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Color */}
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-gray-500 mb-2 block">Text Color</label>
                                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                            {['#FFFFFF', '#F8FAFC', '#E2E8F0', '#94A3B8', '#64748B', '#1E293B', '#111827', '#000000'].map((hex) => (
                                                <button
                                                    key={hex}
                                                    onClick={() => setTextDark(textDark === hex ? '' : hex)}
                                                    className={cn(
                                                        'size-7 md:size-9 rounded-lg md:rounded-xl shrink-0 border-2 transition-all',
                                                        textDark === hex ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
                                                    )}
                                                    style={{ backgroundColor: hex }}
                                                    title={hex}
                                                />
                                            ))}
                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    value={textDark || '#FFFFFF'}
                                                    onChange={(e) => setTextDark(e.target.value)}
                                                    className="size-7 md:size-9 rounded-lg md:rounded-xl border-2 border-gray-200 cursor-pointer"
                                                    title="Custom"
                                                />
                                            </div>
                                            {textDark && (
                                                <button
                                                    onClick={() => setTextDark('')}
                                                    className="text-[10px] text-gray-400 hover:text-gray-600 ml-1 shrink-0"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 md:mt-8">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">Share Preview</h3>
                        <div className="bg-white rounded-2xl border border-gray-100 p-3 md:p-4 flex items-center gap-3 md:gap-4">
                            <div className="size-11 md:size-14 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 p-2">
                                <Image src={business.logo} alt="" width={36} height={36} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-semibold text-gray-900">{business.name} — VEMTAP Partner</p>
                                <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">{business.tagline}</p>
                                <p className="text-[10px] md:text-[11px] text-gray-400 mt-1 truncate">{business.qrValue}</p>
                            </div>
                            <div className="size-11 md:size-12 bg-gray-50 rounded-lg p-1 shrink-0 flex items-center justify-center">
                                <QRCodeSVG value={business.qrValue} size={viewMode === 'mobile' ? 36 : 40} style={{ width: '100%', height: '100%' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 md:mb-4">Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {shareActions.map((action) => {
                                const Icon = action.icon;
                                const isCopied = copied === action.label;
                                return (
                                    <button
                                        key={action.label}
                                        onClick={() => handleAction(action.id)}
                                        className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group"
                                    >
                                        <div className="size-7 md:size-8 rounded-lg bg-white flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                            {isCopied ? <CheckCheck size={14} className="text-emerald-500" /> : <Icon size={14} />}
                                        </div>
                                        <span className="text-[10px] md:text-xs font-medium text-gray-600">{isCopied ? 'Copied!' : action.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Referral Stats</h3>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Total Referrals', value: String(stats?.totalReferrals || 0) },
                                { label: 'Active Referrals', value: String(stats?.activeReferrals || 0) },
                                { label: 'Lifetime Earnings', value: `₦${(stats?.totalEarnings || 0).toLocaleString()}` },
                            ].map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between">
                                    <span className="text-xs md:text-sm text-gray-500">{stat.label}</span>
                                    <span className="text-xs md:text-sm font-semibold text-gray-900">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setPreviewOpen(true)}
                        className="w-full py-3 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-all"
                    >
                        Full Preview
                    </button>
                </div>
            </div>
            {previewOpen && (
                <CardDesignPreview
                    accentColor={accentColor}
                    textDark={textDark}
                    layout={layout}
                    business={business}
                    onClose={() => setPreviewOpen(false)}
                    footer={
                        <button
                            onClick={() => { handleCopy('preview-link', business.qrValue); setPreviewOpen(false); }}
                            className="w-full py-3 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-all"
                        >
                            {copied === 'preview-link' ? 'Copied!' : 'Share This Card'}
                        </button>
                    }
                />
            )}
        </div>
    );
}
