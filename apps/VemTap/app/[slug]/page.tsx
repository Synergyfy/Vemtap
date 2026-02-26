'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin, Phone, Mail, Globe, ShieldCheck, Instagram,
    Twitter, Facebook, Share2, Building2, Linkedin, ExternalLink,
    ChevronRight, LayoutDashboard, Loader2, Star
} from 'lucide-react';
import { fetchDeviceByCode, Device } from '@/lib/api/devices';

export default function BusinessPublicPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [businessData, setBusinessData] = useState<Device | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadBusiness = async () => {
            if (!slug) return;

            // Handle reserved routes that might be caught by the dynamic [slug] route
            if (slug.toLowerCase() === 'customer') {
                router.replace('/customer/dashboard');
                return;
            }

            if (slug.toLowerCase() === 'admin' || slug.toLowerCase() === 'dashboard') {
                router.replace('/login');
                return;
            }

            try {
                // Fetching using slug as the code context
                const data = await fetchDeviceByCode(slug);
                setBusinessData(data);
            } catch (err) {
                console.error('Failed to load business data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadBusiness();
    }, [slug, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!businessData?.business) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-6 text-center">
                <Building2 size={64} className="text-slate-300 mb-4" />
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Business Not Found</h1>
                <p className="text-slate-500 font-bold mb-8">We couldn't find the business you're looking for.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-8 h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    const { business } = businessData;
    const businessName = business.name || 'VemTap Business';
    const logoUrl = business.logoUrl;

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            {/* Hero / Cover */}
            <div className="h-64 bg-linear-to-br from-primary to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150" />
                </div>

                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                    <button
                        onClick={() => router.back()}
                        className="size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/10"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <button className="size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/10">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Profile Info Overlay */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20">
                <div className="bg-white rounded-4xl shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-white font-sans">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="size-32 rounded-3xl bg-white p-2 shadow-2xl shadow-primary/10 -mt-24 md:-mt-32">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={businessName}
                                    className="w-full h-full rounded-2xl object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-2xl bg-primary flex items-center justify-center text-white text-4xl font-black">
                                    {businessName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight capitalize">
                                    {businessName}
                                </h1>
                                <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full" title="Verified Business">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 font-bold text-sm">
                                <div className="flex items-center gap-1.5 text-primary">
                                    <Building2 size={16} />
                                    <span className="font-bold text-slate-900">{business.category || business.type || 'Business'}</span>
                                </div>
                                {business.address && (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={16} />
                                            <span>{business.address}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/customer/dashboard`)}
                            className="w-full md:w-auto px-8 h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >
                            Open Dashboard
                        </button>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* About Side */}
                        <div className="md:col-span-2 space-y-10">
                            {business.welcomeMessage && (
                                <section>
                                    <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight">About Us</h2>
                                    <p className="text-slate-600 leading-relaxed font-bold">
                                        {business.welcomeMessage}
                                    </p>
                                </section>
                            )}

                            {business.rewardEnabled && (
                                <section className="p-8 rounded-3xl bg-linear-to-br from-primary/5 to-indigo-500/5 border border-primary/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-primary p-2 rounded-xl text-white">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Loyalty Program</h2>
                                    </div>
                                    <p className="text-slate-600 font-bold mb-6">
                                        {business.rewardMessage || `Every visit counts! Visit us ${business.rewardVisitThreshold || 5} times to earn exclusive rewards.`}
                                    </p>
                                    <button
                                        onClick={() => router.push(`/customer/dashboard`)}
                                        className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Check Benefits <ExternalLink size={14} />
                                    </button>
                                </section>
                            )}
                        </div>

                        {/* Contact info side */}
                        <div className="space-y-8">
                            <div className="p-8 bg-slate-900 rounded-4xl text-white">
                                <h3 className="text-lg font-black mb-6">Connect with us</h3>
                                <div className="space-y-5">
                                    {business.whatsappNumber && (
                                        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(`https://wa.me/${business.whatsappNumber}`, '_blank')}>
                                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors text-white">
                                                <Phone size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{business.whatsappNumber}</span>
                                        </div>
                                    )}
                                    {business.officialEmail && (
                                        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(`mailto:${business.officialEmail}`, '_blank')}>
                                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors text-white">
                                                <Mail size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors truncate">{business.officialEmail}</span>
                                        </div>
                                    )}
                                    {business.website && (
                                        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(business.website.startsWith('http') ? business.website : `https://${business.website}`, '_blank')}>
                                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors text-white">
                                                <Globe size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors truncate">{business.website}</span>
                                        </div>
                                    )}
                                </div>

                                {(business.reviewUrl && business.showReview) || (business.showSocial && (business.linkedinUrl)) ? (
                                    <div className="mt-10 pt-8 border-t border-white/10 flex justify-center gap-6">
                                        {business.reviewUrl && business.showReview && (
                                            <button
                                                onClick={() => window.open(business.reviewUrl, '_blank')}
                                                className="size-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:scale-110 transition-all"
                                                title="Google Review"
                                            >
                                                <Star size={20} />
                                            </button>
                                        )}
                                        {business.linkedinUrl && business.showSocial && (
                                            <button
                                                onClick={() => window.open(business.linkedinUrl, '_blank')}
                                                className="size-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all"
                                                title="LinkedIn"
                                            >
                                                <Linkedin size={20} />
                                            </button>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-20 text-center">
                    <p className="text-slate-400 font-bold text-sm tracking-tight mb-8">
                        Powered by <span className="font-black text-slate-900 tracking-tighter">VemTap</span> — Connecting businesses and customers smartly.
                    </p>
                    <button
                        onClick={() => router.push('/customer/dashboard')}
                        className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-xs hover:gap-4 transition-all"
                    >
                        Open Dashboard <LayoutDashboard size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
