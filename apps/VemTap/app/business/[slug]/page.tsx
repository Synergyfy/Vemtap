'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin, Phone, Mail, Globe, ShieldCheck, Instagram,
    Twitter, Facebook, Share2, Building2, Linkedin, ExternalLink,
    ChevronRight, Loader2, Star, Clock, Youtube, Link as LinkIcon,
    MessageSquare, Gift, CheckCircle2, Heart, Sparkles, Trophy,
    Users, Zap
} from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';

export default function BusinessProfilePage() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: business, isLoading } = useMyBusiness();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    const requestedSlug = typeof slug === 'string' ? slug.toLowerCase() : '';
    const businessSlug = (business?.name || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-');
    const isSlugMismatch = !!requestedSlug && !!businessSlug && requestedSlug !== businessSlug;

    if (!business || isSlugMismatch) {
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

    const businessName = business.name || 'VemTap Business';
    const logoUrl = business.logoUrl;
    const businessType = business.type || business.category || 'Business';

    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    const formatHours = (day: string) => {
        const hours = business.businessHours?.[day as keyof typeof business.businessHours];
        if (!hours || hours.closed) return 'Closed';
        return `${hours.open} - ${hours.close}`;
    };

    const isOpenNow = () => {
        const now = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[now.getDay()];
        const hours = business.businessHours?.[todayName as keyof typeof business.businessHours];
        if (!hours || hours.closed) return false;
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return currentTime >= hours.open && currentTime <= hours.close;
    };

    const getTodayName = () => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dayNames[new Date().getDay()];
    };

    const hasSocialLinks = business.showSocial && (
        business.instagramUrl || business.xUrl || business.facebookUrl ||
        business.linkedinUrl || business.tiktokUrl || business.youtubeUrl || business.customLink
    );

    return (
        <div className="min-h-screen bg-[#fafbfc] font-sans selection:bg-primary/10">
            {/* Hero Header */}
            <div className="h-[42vh] bg-linear-to-b from-slate-50 to-[#fafbfc] relative overflow-hidden flex items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] left-[-5%] size-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-5%] size-96 bg-indigo-500/5 rounded-full blur-3xl" />
                    <div className="absolute top-[20%] right-[20%] size-48 bg-emerald-500/3 rounded-full blur-2xl" />
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
                    <div className="text-slate-400 font-bold text-sm tracking-wide flex items-center gap-2 flex-wrap justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-wider">
                            <Building2 size={12} />
                            {businessType}
                        </span>
                        {business.address && (
                            <>
                                <span className="text-slate-200">•</span>
                                <span className="flex items-center gap-1"><MapPin size={14} /> {business.address}</span>
                            </>
                        )}
                        {business.businessHours && (
                            <>
                                <span className="text-slate-200">•</span>
                                <span className={`flex items-center gap-1 text-xs font-black ${isOpenNow() ? 'text-emerald-500' : 'text-red-400'}`}>
                                    <span className={`size-2 rounded-full ${isOpenNow() ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                                    {isOpenNow() ? 'Open Now' : 'Closed'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Primary Info Column */}
                    <div className="md:col-span-8 space-y-6">
                        {/* About + Welcome Section */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-white/50">
                            {business.about && (
                                <section className="mb-10">
                                    <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-5 flex items-center gap-2">
                                        <Sparkles size={14} /> About Us
                                    </h2>
                                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-bold">
                                        {business.about}
                                    </p>
                                </section>
                            )}

                            {/* Customer Messages */}
                            {(business.welcomeMessage || business.successMessage || business.privacyMessage) && (
                                <section className="mb-10">
                                    <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-5 flex items-center gap-2">
                                        <MessageSquare size={14} /> Customer Messages
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {business.welcomeMessage && (
                                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                                                <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Heart size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600 mb-1">Welcome Message</p>
                                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{business.welcomeMessage}</p>
                                                </div>
                                            </div>
                                        )}
                                        {business.successMessage && (
                                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                                                <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest font-black text-blue-600 mb-1">Success Message</p>
                                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{business.successMessage}</p>
                                                </div>
                                            </div>
                                        )}
                                        {business.privacyMessage && (
                                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                                                <div className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Privacy Notice</p>
                                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{business.privacyMessage}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Rewards Section */}
                            {business.rewardEnabled && (
                                <section className="mb-10 p-8 rounded-[2rem] bg-linear-to-br from-amber-50/80 to-orange-50/50 border border-amber-100/50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -mr-10 -mt-10" />
                                    <div className="relative">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="size-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                                <Trophy size={22} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900">Loyalty Rewards</h3>
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600">Earn rewards on every visit</p>
                                            </div>
                                        </div>
                                        {business.rewardMessage && (
                                            <div className="p-4 rounded-xl bg-white/60 border border-amber-100/50 mb-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Gift size={14} className="text-amber-600" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Reward</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">{business.rewardMessage}</p>
                                            </div>
                                        )}
                                        {business.rewardVisitThreshold && (
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-1">
                                                    {Array.from({ length: Math.min(business.rewardVisitThreshold, 7) }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="size-8 rounded-full bg-amber-100 border-2 border-amber-50 flex items-center justify-center text-amber-600"
                                                        >
                                                            <Star size={12} fill="currentColor" />
                                                        </div>
                                                    ))}
                                                    {business.rewardVisitThreshold > 7 && (
                                                        <div className="size-8 rounded-full bg-amber-200 border-2 border-amber-50 flex items-center justify-center text-amber-700 text-[10px] font-black">
                                                            +{business.rewardVisitThreshold - 7}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs font-black text-slate-600">
                                                    Visit <span className="text-amber-600">{business.rewardVisitThreshold} times</span> to unlock
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Business Hours */}
                            {business.businessHours && Object.keys(business.businessHours).length > 0 && (
                                <section className="p-6 rounded-2xl bg-slate-50/80">
                                    <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary mb-5 flex items-center gap-2">
                                        <Clock size={14} /> Business Hours
                                    </h2>
                                    <div className="space-y-2">
                                        {DAYS.map((day) => {
                                            const isToday = getTodayName() === day;
                                            const hours = business.businessHours?.[day];
                                            const isClosed = !hours || hours.closed;
                                            return (
                                                <div
                                                    key={day}
                                                    className={`flex justify-between items-center px-4 py-3 rounded-xl transition-all ${isToday
                                                            ? 'bg-primary/5 border border-primary/10 shadow-sm'
                                                            : 'hover:bg-white/60'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isToday && (
                                                            <span className="size-2 rounded-full bg-primary animate-pulse" />
                                                        )}
                                                        <span className={`text-sm capitalize ${isToday ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>
                                                            {day}
                                                            {isToday && <span className="text-[10px] text-primary ml-2 uppercase tracking-wider">Today</span>}
                                                        </span>
                                                    </div>
                                                    <span className={`text-sm font-black ${isClosed ? 'text-red-400' : isToday ? 'text-primary' : 'text-slate-900'
                                                        }`}>
                                                        {formatHours(day)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Feature Badges */}
                            <div className="grid grid-cols-3 gap-4 mt-10 pt-10 border-t border-slate-50">
                                <div className="text-center">
                                    <div className="size-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Status</p>
                                    <p className="text-sm font-black text-slate-900 capitalize">{business.status?.toLowerCase()}</p>
                                </div>
                                <div className="text-center">
                                    <div className="size-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                                        <Zap size={20} />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Rewards</p>
                                    <p className="text-sm font-black text-slate-900">{business.rewardEnabled ? 'Active' : 'Inactive'}</p>
                                </div>
                                <div className="text-center">
                                    <div className="size-12 mx-auto rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                                        <MessageSquare size={20} />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Feedback</p>
                                    <p className="text-sm font-black text-slate-900">{business.showFeedback ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="md:col-span-4 space-y-6">
                        {/* Contact Info */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white/50">
                            <h3 className="text-sm font-black text-slate-900 mb-8 tracking-tight">Contact Details</h3>
                            <div className="space-y-5">
                                {business.whatsappNumber && (
                                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(`https://wa.me/${business.whatsappNumber}`, '_blank')}>
                                        <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Phone size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">WhatsApp</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">{business.whatsappNumber}</p>
                                        </div>
                                        <ExternalLink size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
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
                                        <ExternalLink size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
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
                                        <ExternalLink size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                )}

                                {/* Show a placeholder if no contact info */}
                                {!business.whatsappNumber && !business.officialEmail && !business.website && (
                                    <div className="text-center py-4">
                                        <p className="text-sm font-bold text-slate-400">No contact info added yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Social Links */}
                            {hasSocialLinks && (
                                <div className="mt-8 pt-6 border-t border-slate-50">
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-4">Follow Us</p>
                                    <div className="flex flex-wrap gap-2">
                                        {business.facebookUrl && (
                                            <button onClick={() => window.open(business.facebookUrl, '_blank')} className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 hover:scale-110 transition-all">
                                                <Facebook size={18} />
                                            </button>
                                        )}
                                        {business.instagramUrl && (
                                            <button onClick={() => window.open(business.instagramUrl, '_blank')} className="size-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-100 hover:scale-110 transition-all">
                                                <Instagram size={18} />
                                            </button>
                                        )}
                                        {business.tiktokUrl && (
                                            <button onClick={() => window.open(business.tiktokUrl, '_blank')} className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 hover:scale-110 transition-all">
                                                <span className="text-xs font-black">TT</span>
                                            </button>
                                        )}
                                        {business.xUrl && (
                                            <button onClick={() => window.open(business.xUrl, '_blank')} className="size-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center hover:bg-slate-100 hover:scale-110 transition-all">
                                                <Twitter size={18} />
                                            </button>
                                        )}
                                        {business.youtubeUrl && (
                                            <button onClick={() => window.open(business.youtubeUrl, '_blank')} className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 hover:scale-110 transition-all">
                                                <Youtube size={18} />
                                            </button>
                                        )}
                                        {business.linkedinUrl && (
                                            <button onClick={() => window.open(business.linkedinUrl, '_blank')} className="size-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-100 hover:scale-110 transition-all">
                                                <Linkedin size={18} />
                                            </button>
                                        )}
                                        {business.customLink && (
                                            <button onClick={() => window.open(business.customLink, '_blank')} className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 hover:scale-110 transition-all">
                                                <LinkIcon size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Review Button */}
                            {business.showReview && business.reviewUrl && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => window.open(business.reviewUrl, '_blank')}
                                        className="w-full h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors text-xs font-black uppercase tracking-widest"
                                    >
                                        <Star size={16} fill="currentColor" />
                                        Leave a Review
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick Info Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white/50">
                            <h3 className="text-sm font-black text-slate-900 mb-6 tracking-tight">Quick Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">Type</span>
                                    <span className="text-xs font-black text-slate-900 capitalize px-3 py-1 bg-slate-50 rounded-lg">
                                        {businessType.toLowerCase()}
                                    </span>
                                </div>
                                {business.rewardEnabled && business.rewardVisitThreshold && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">Reward Visits</span>
                                        <span className="text-xs font-black text-amber-600 px-3 py-1 bg-amber-50 rounded-lg">
                                            {business.rewardVisitThreshold} visits
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">Social Links</span>
                                    <span className={`text-xs font-black px-3 py-1 rounded-lg ${business.showSocial ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'}`}>
                                        {business.showSocial ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">Reviews</span>
                                    <span className={`text-xs font-black px-3 py-1 rounded-lg ${business.showReview ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'}`}>
                                        {business.showReview ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">Feedback</span>
                                    <span className={`text-xs font-black px-3 py-1 rounded-lg ${business.showFeedback ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'}`}>
                                        {business.showFeedback ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Status */}
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

                {/* Main CTA */}
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
