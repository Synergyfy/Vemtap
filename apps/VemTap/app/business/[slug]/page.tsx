'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin, Phone, Mail, Globe, ShieldCheck, Instagram,
    Twitter, Facebook, Share2, Building2, Linkedin, ExternalLink,
    ChevronRight, LayoutDashboard, Loader2, Star, Clock, Youtube, Link as LinkIcon
} from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';

export default function BusinessProfilePage() {
    const { slug } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: business, isLoading } = useMyBusiness();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-6 text-center">
                <Building2 size={64} className="text-slate-300 mb-4" />
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Business Not Found</h1>
                <p className="text-slate-500 font-bold mb-8">We couldn't find your business profile.</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const businessName = business.name || user?.businessName || 'VemTap Business';
    const logoUrl = business.logoUrl;

    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    const formatHours = (day: string) => {
        const hours = business.businessHours?.[day as keyof typeof business.businessHours];
        if (!hours || hours.closed) return 'Closed';
        return `${hours.open} - ${hours.close}`;
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] font-sans selection:bg-primary/10">
            {/* Minimal Header */}
            <div className="h-[40vh] bg-linear-to-b from-slate-50 to-[#fafbfc] relative overflow-hidden flex items-center justify-center">
                {/* Abstract background elements for a "premium" feel */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] left-[-5%] size-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-5%] size-96 bg-indigo-500/5 rounded-full blur-3xl" />
                </div>

                <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10 font-bold uppercase tracking-widest text-[10px]">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                    >
                        <ChevronRight size={14} className="rotate-180" /> Back
                    </button>
                    <div className="text-slate-900 tracking-[0.3em] font-black">
                        Preview Profile
                    </div>
                    <button className="text-slate-400 hover:text-primary transition-colors">
                        <Share2 size={16} />
                    </button>
                </div>

                {/* Hero Content */}
                <div className="flex flex-col items-center text-center z-10 px-6">
                    <div className="size-28 md:size-32 rounded-3xl bg-white p-1.5 shadow-2xl shadow-slate-200/50 mb-6 border border-white">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={businessName}
                                className="w-full h-full rounded-2xl object-cover"
                            />
                        ) : (
                            <div className="w-full h-full rounded-2xl bg-slate-50 flex items-center justify-center text-primary text-4xl font-black italic">
                                {businessName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight capitalize">
                            {businessName}
                        </h1>
                        <ShieldCheck size={24} className="text-emerald-500" />
                    </div>
                    <div className="text-slate-400 font-bold text-sm tracking-wide flex items-center gap-2">
                        <span className="text-primary">{business.category || 'Business'}</span>
                        {business.address && (
                            <>
                                <span className="text-slate-200">•</span>
                                <span className="flex items-center gap-1"><MapPin size={14} /> {business.address}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Primary Info Card */}
                    <div className="md:col-span-8 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-white/50">
                            {business.about && (
                                <section className="mb-12">
                                    <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-6">About the Business</h2>
                                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-bold">
                                        {business.about}
                                    </p>
                                </section>
                            )}

                            {!business.about && business.welcomeMessage && (
                                <section className="mb-12">
                                    <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-6">Welcome</h2>
                                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-bold">
                                        {business.welcomeMessage}
                                    </p>
                                </section>
                            )}

                            {business.businessHours && Object.keys(business.businessHours).length > 0 && (
                                <section className="mb-12 p-6 rounded-2xl bg-slate-50">
                                    <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-6 flex items-center gap-2">
                                        <Clock size={16} /> Business Hours
                                    </h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        {DAYS.map((day) => (
                                            <div key={day} className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-slate-500 capitalize">{day}</span>
                                                <span className={`font-black ${business.businessHours?.[day]?.closed ? 'text-red-400' : 'text-slate-900'}`}>
                                                    {formatHours(day)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {business.rewardEnabled && (
                                <section className="p-8 rounded-[2rem] bg-linear-to-br from-slate-50 to-white border border-slate-100/50">
                                    <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Star size={16} fill="currentColor" />
                                        </div>
                                        Exclusive Rewards
                                    </h3>
                                    <p className="text-slate-500 font-bold mb-6 leading-relaxed">
                                        {business.rewardMessage || `Visit us ${business.rewardVisitThreshold || 5} times to unlock special rewards and benefits tailored for you.`}
                                    </p>
                                </section>
                            )}

                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-slate-50 text-center md:text-left">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Impact</p>
                                    <p className="text-xl font-black text-slate-900">{business.monthlyVisitors || 'N/A'}</p>
                                    <p className="text-[10px] font-bold text-slate-400">Monthly Visitors</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Focus</p>
                                    <p className="text-xl font-black text-slate-900 truncate">{business.goal || 'Quality Service'}</p>
                                    <p className="text-[10px] font-bold text-slate-400">Primary Goal</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Sidebar (Light) */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white/50">
                            <h3 className="text-sm font-black text-slate-900 mb-8 tracking-tight">Public Contact</h3>
                            <div className="space-y-6">
                                {business.whatsappNumber && (
                                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(`https://wa.me/${business.whatsappNumber}`, '_blank')}>
                                        <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Phone size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">WhatsApp</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">{business.whatsappNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {business.officialEmail && (
                                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => {
                                        if (business.officialEmail) window.open(`mailto:${business.officialEmail}`, '_blank');
                                    }}>
                                        <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Email</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">{business.officialEmail}</p>
                                        </div>
                                    </div>
                                )}
                                {business.website && (
                                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => {
                                        const website = business.website;
                                        if (website) {
                                            const url = website.startsWith('http') ? website : `https://${website}`;
                                            window.open(url, '_blank');
                                        }
                                    }}>
                                        <div className="size-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Globe size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Website</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">{business.website}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Small Social Row */}
                            {business.showSocial && (business.instagramUrl || business.xUrl || business.facebookUrl || business.linkedinUrl || business.tiktokUrl || business.youtubeUrl || business.customLink) && (
                                <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap gap-2">
                                    {business.facebookUrl && (
                                        <button onClick={() => window.open(business.facebookUrl, '_blank')} className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                            <Facebook size={18} />
                                        </button>
                                    )}
                                    {business.instagramUrl && (
                                        <button onClick={() => window.open(business.instagramUrl, '_blank')} className="size-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-100 transition-colors">
                                            <Instagram size={18} />
                                        </button>
                                    )}
                                    {business.tiktokUrl && (
                                        <button onClick={() => window.open(business.tiktokUrl, '_blank')} className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                                            <span className="text-xs font-black">TT</span>
                                        </button>
                                    )}
                                    {business.xUrl && (
                                        <button onClick={() => window.open(business.xUrl, '_blank')} className="size-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                            <Twitter size={18} />
                                        </button>
                                    )}
                                    {business.youtubeUrl && (
                                        <button onClick={() => window.open(business.youtubeUrl, '_blank')} className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                                            <Youtube size={18} />
                                        </button>
                                    )}
                                    {business.linkedinUrl && (
                                        <button onClick={() => window.open(business.linkedinUrl, '_blank')} className="size-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-100 transition-colors">
                                            <Linkedin size={18} />
                                        </button>
                                    )}
                                    {business.customLink && (
                                        <button onClick={() => window.open(business.customLink, '_blank')} className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors">
                                            <LinkIcon size={18} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {business.showReview && business.reviewUrl && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => window.open(business.reviewUrl, '_blank')}
                                        className="w-full h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors text-xs font-black uppercase tracking-widest"
                                    >
                                        <Star size={16} fill="currentColor" />
                                        Google Review
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-slate-900/20">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Profile Status</p>
                                    <p className="text-sm font-bold uppercase">{business.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main CTA - Prominent and Stunning */}
                <div className="mt-12 text-center flex flex-col items-center">
                    <button
                        onClick={() => router.push('/dashboard/settings/profile')}
                        className="group relative px-12 h-20 bg-slate-900 text-white rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-900/40 hover:scale-105 transition-all duration-500"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center gap-4">
                            <div className="flex flex-col items-start text-left">
                                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">Need to update?</span>
                                <span className="text-lg font-black tracking-tight">Edit Business Settings</span>
                            </div>
                            <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </button>

                    <div className="mt-12 flex items-center gap-4 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-default">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Powered by</span>
                        <div className="h-6 w-px bg-slate-200" />
                        <span className="text-lg font-black tracking-tighter text-slate-900">VemTap</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

