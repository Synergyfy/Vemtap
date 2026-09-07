'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    MapPin, Phone, Mail, Globe, Instagram,
    Twitter, Facebook, Share2, Building2, Linkedin, ExternalLink,
    LayoutDashboard, Loader2, Star, Youtube, Link as LinkIcon,
    ArrowLeft, Navigation, ChevronDown
} from 'lucide-react';
import { fetchDeviceByCode, fetchContextByUsername } from '@/lib/api/devices';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { TapJourneyContainer } from '@/components/visitor/TapJourneyContainer';
import { useTrackReferralVisit } from '@/services/affiliates/hooks';
import { normalizeDayHours } from '@/lib/businessHours';
import { formatNaira } from '@/components/home/mappers';
import DealEngagementBar from '@/components/deals/DealEngagementBar';
import ImageGallery from '@/components/ui/ImageGallery';
import { notify } from '@/lib/notify';

interface BusinessPublicPageClientProps {
    slug: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
}

export default function BusinessPublicPageClient({ slug, initialData }: BusinessPublicPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const storeDeviceCode = useCustomerFlowStore(state => state.deviceCode);
    const queryCode = searchParams.get('code');
    const deviceCode = storeDeviceCode || queryCode;

    const referralCode = searchParams.get('ref');
    const trackVisit = useTrackReferralVisit();

    useEffect(() => {
        if (referralCode && typeof window !== 'undefined') {
            trackVisit.mutate({ referralCode });
        }
    }, [referralCode, trackVisit]);

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const isCustomerAccount = isAuthenticated && user?.role?.toLowerCase() === 'customer';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [businessData, setBusinessData] = useState<any>(initialData || null);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [isUsernameMode, setIsUsernameMode] = useState(!!initialData);
    const [isFavorited, setIsFavorited] = useState(false);
    const [showHours, setShowHours] = useState(false);
    const [showLocation, setShowLocation] = useState(false);

    useEffect(() => {
        if (initialData) return;

        const loadPageData = async () => {
            try {
                const usernameContext = await fetchContextByUsername(slug);
                if (usernameContext) {
                    setBusinessData(usernameContext);
                    setIsUsernameMode(true);
                    setIsLoading(false);
                    return;
                }
            } catch {
                console.log('Not a username context, checking for device code');
            }

            if (!deviceCode) {
                setIsLoading(false);
                return;
            }

            if (!isAuthenticated && deviceCode) {
                router.replace(`/${slug}/${deviceCode}`);
                return;
            }

            try {
                const data = await fetchDeviceByCode(deviceCode);
                setBusinessData(data);
            } catch (err) {
                console.error('Failed to load business data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadPageData();
    }, [deviceCode, slug, isAuthenticated, router, initialData]);

    const handleShare = useCallback(async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const text = `Check out ${businessData?.business?.name || 'this business'} on VemTap`;
        if (navigator.share) {
            try {
                await navigator.share({ title: businessData?.business?.name || 'Business', text, url });
            } catch { /* user cancelled */ }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                notify.success('Link copied to clipboard');
            } catch {
                notify.error('Failed to copy link');
            }
        }
    }, [businessData]);

    const handleDirections = useCallback(() => {
        const address = businessData?.business?.address || 'Wuse 2, Abuja';
        const query = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }, [businessData]);

    const handleContact = useCallback(() => {
        const phone = businessData?.business?.phone;
        if (phone) {
            window.open(`tel:${phone}`, '_self');
        } else {
            notify.error('No phone number available');
        }
    }, [businessData]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    if (isUsernameMode && businessData) {
        return <TapJourneyContainer username={slug} />;
    }

    if (!businessData?.business) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <Building2 size={64} className="text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-on-surface mb-2">Business Not Found</h1>
                <p className="text-on-surface-variant mb-8">We couldn&apos;t find the business you&apos;re looking for.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-8 h-12 bg-primary text-white font-semibold rounded-full"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    const { business } = businessData;
    const businessName = business.name || 'VemTap Business';
    const logoUrl = business.logoUrl;
    const coverUrl = business.coverUrl || business.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop';
    const isOpen = business.isOpens ?? true;

    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    const formatHours = (day: string) => {
        const hours = business.openingHours?.[day as keyof typeof business.openingHours];
        const norm = normalizeDayHours(hours);
        if (!norm || norm.isClosed) return 'Closed';
        if (!norm.from || !norm.to) return 'Closed';
        return `${norm.from} - ${norm.to}`;
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const full = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        for (let i = 0; i < 5; i++) {
            if (i < full) {
                stars.push(
                    <span key={i} className="material-symbols-outlined text-[18px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                );
            } else if (i === full && hasHalf) {
                stars.push(
                    <span key={i} className="material-symbols-outlined text-[18px] text-amber-500">star_half</span>
                );
            } else {
                stars.push(
                    <span key={i} className="material-symbols-outlined text-[18px] text-gray-300">star</span>
                );
            }
        }
        return stars;
    };

    return (
        <div className="min-h-screen bg-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Fixed Header */}
            <header className="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex items-center justify-center">
                <div className="w-full max-w-5xl flex items-center justify-between px-5 h-14">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
                    >
                        <ArrowLeft size={20} className="text-primary" />
                    </button>
                    <h1 className="font-semibold text-base text-primary truncate mx-4">Business Profile</h1>
                    <button
                        onClick={handleShare}
                        aria-label="Share"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
                    >
                        <Share2 size={20} className="text-primary" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-14 pb-20">
                <div className="max-w-5xl mx-auto">
                    {/* Hero Section */}
                    <div className="relative w-full h-60 bg-surface-container-high">
                        <img
                            alt={`${businessName} cover`}
                            className="w-full h-full object-cover"
                            src={coverUrl}
                        />
                        {/* Logo Overlay */}
                        <div className="absolute -bottom-10 left-5 w-24 h-24 bg-surface rounded-full p-1 shadow-sm border border-outline-variant">
                            {logoUrl ? (
                                <img alt={`${businessName} logo`} className="w-full h-full object-cover rounded-full" src={logoUrl} />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-primary text-3xl font-bold">
                                    {businessName.charAt(0)}
                                </div>
                            )}
                        </div>
                        {/* Status Badge */}
                        <div className="absolute bottom-4 right-5 bg-surface px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className={`text-xs font-medium ${isOpen ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isOpen ? 'Open Now' : 'Closed'}
                            </span>
                        </div>
                    </div>

                    {/* Business Info */}
                    <div className="px-5 pt-12 pb-6 border-b border-outline-variant">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-2xl font-semibold text-on-surface mb-1">{businessName}</h2>
                                <p className="text-sm text-on-surface-variant flex items-center gap-1">
                                    <MapPin size={16} />
                                    {business.address || 'Wuse 2, Abuja'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsFavorited(!isFavorited)}
                                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95"
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        fontSize: 20,
                                        color: isFavorited ? '#ba1a1a' : '#0055c4',
                                        fontVariationSettings: isFavorited ? "'FILL' 1" : undefined,
                                    }}
                                >
                                    favorite_border
                                </span>
                            </button>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex">{renderStars(4.8)}</div>
                            <span className="font-semibold text-sm text-on-surface">4.8</span>
                            <span className="text-sm text-on-surface-variant">(324 reviews)</span>
                        </div>

                        <p className="text-sm text-on-surface mb-6 line-clamp-2">
                            {business.about || 'Welcome to our business. We offer premium services and products to our valued customers.'}
                        </p>

                        {/* Quick Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleDirections}
                                className="flex-1 bg-primary text-white font-semibold h-12 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <Navigation size={20} />
                                Directions
                            </button>
                            <button
                                onClick={handleContact}
                                className="flex-1 border border-primary text-primary font-semibold h-12 rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-transform"
                            >
                                <Phone size={20} />
                                Contact
                            </button>
                        </div>
                    </div>

                    {/* Active Deals — shown via /{slug}/deals page */}

                    {/* Products Section — shown via /{slug}/catalog page */}

                    {/* Services Section — shown via /{slug}/catalog page */}

                    {/* Business Hours - Collapsible */}
                    {business.openingHours && (
                        <section className="border-b border-outline-variant">
                            <button
                                onClick={() => setShowHours(!showHours)}
                                className="w-full px-5 py-6 flex items-center justify-between"
                            >
                                <h3 className="text-lg font-semibold text-on-surface">Business Hours</h3>
                                <ChevronDown
                                    size={20}
                                    className={`text-on-surface-variant transition-transform duration-200 ${showHours ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {showHours && (
                                <div className="px-5 pb-6 grid grid-cols-2 gap-3">
                                    {DAYS.map((day) => (
                                        <div key={day} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-on-surface-variant capitalize">{day}</span>
                                            <span className={`font-semibold ${business.openingHours?.[day]?.closed ? 'text-red-500' : 'text-on-surface'}`}>
                                                {formatHours(day)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Location - Collapsible */}
                    <section className="border-b border-outline-variant">
                        <button
                            onClick={() => setShowLocation(!showLocation)}
                            className="w-full px-5 py-6 flex items-center justify-between"
                        >
                            <h3 className="text-lg font-semibold text-on-surface">Location</h3>
                            <ChevronDown
                                size={20}
                                className={`text-on-surface-variant transition-transform duration-200 ${showLocation ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {showLocation && (
                            <div className="px-5 pb-6">
                                <div className="w-full h-40 bg-surface-container-high rounded-xl border border-outline-variant overflow-hidden relative">
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center opacity-70">
                                        <MapPin size={40} className="text-primary" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: 24 }}>location_on</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-on-surface-variant mt-2">
                                    {business.address || '14 Aminu Kano Crescent, Wuse 2, Abuja, Nigeria'}
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Direct Connect */}
                    <section className="py-6 border-b border-outline-variant px-5">
                        <h3 className="text-lg font-semibold text-on-surface mb-4">Direct Connect</h3>
                        <div className="space-y-4">
                            {business.phone && (
                                <div
                                    className="flex items-center gap-4 group cursor-pointer"
                                    onClick={() => window.open(`tel:${business.phone}`, '_self')}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Phone size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-on-surface-variant font-medium">Phone</p>
                                        <p className="text-sm font-semibold text-on-surface truncate">{business.phone}</p>
                                    </div>
                                </div>
                            )}
                            {business.email && (
                                <div
                                    className="flex items-center gap-4 group cursor-pointer"
                                    onClick={() => window.open(`mailto:${business.email}`, '_blank')}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Mail size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-on-surface-variant font-medium">Email</p>
                                        <p className="text-sm font-semibold text-on-surface truncate">{business.email}</p>
                                    </div>
                                </div>
                            )}
                            {business.website && (
                                <div
                                    className="flex items-center gap-4 group cursor-pointer"
                                    onClick={() => {
                                        const url = business.website?.startsWith('http') ? business.website : `https://${business.website}`;
                                        window.open(url, '_blank');
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Globe size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-on-surface-variant font-medium">Website</p>
                                        <p className="text-sm font-semibold text-on-surface truncate">{business.website}</p>
                                    </div>
                                </div>
                            )}
                            {business.whatsappNumber && (
                                <div
                                    className="flex items-center gap-4 group cursor-pointer"
                                    onClick={() => window.open(`https://wa.me/${business.whatsappNumber}`, '_blank')}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Phone size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-on-surface-variant font-medium">WhatsApp</p>
                                        <p className="text-sm font-semibold text-on-surface truncate">{business.whatsappNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        {business.showSocial && (
                            <div className="mt-6 pt-6 border-t border-outline-variant flex flex-wrap gap-2">
                                {business.facebookUrl && (
                                    <button onClick={() => window.open(business.facebookUrl, '_blank')} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                        <Facebook size={18} />
                                    </button>
                                )}
                                {business.instagramUrl && (
                                    <button onClick={() => window.open(business.instagramUrl, '_blank')} className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-100 transition-colors">
                                        <Instagram size={18} />
                                    </button>
                                )}
                                {business.tiktokUrl && (
                                    <button onClick={() => window.open(business.tiktokUrl, '_blank')} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                                        <span className="text-xs font-bold">TT</span>
                                    </button>
                                )}
                                {business.xUrl && (
                                    <button onClick={() => window.open(business.xUrl, '_blank')} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                        <Twitter size={18} />
                                    </button>
                                )}
                                {business.youtubeUrl && (
                                    <button onClick={() => window.open(business.youtubeUrl, '_blank')} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                                        <Youtube size={18} />
                                    </button>
                                )}
                                {business.linkedinUrl && (
                                    <button onClick={() => window.open(business.linkedinUrl, '_blank')} className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-100 transition-colors">
                                        <Linkedin size={18} />
                                    </button>
                                )}
                                {business.customLink && (
                                    <button onClick={() => window.open(business.customLink, '_blank')} className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors">
                                        <LinkIcon size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Rewards */}
                    {business.rewardEnabled && business.showRewards !== false && isCustomerAccount && (
                        <section className="py-6 border-b border-outline-variant px-5">
                            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                <h3 className="font-semibold text-on-surface mb-2 flex items-center gap-2">
                                    <Star size={18} fill="currentColor" className="text-primary" />
                                    Exclusive Rewards
                                </h3>
                                <p className="text-sm text-on-surface-variant mb-4">
                                    {business.rewardMessage || `Visit us ${business.rewardVisitThreshold || 5} times to unlock special rewards.`}
                                </p>
                                <button
                                    onClick={() => router.push('/customer/dashboard')}
                                    className="text-primary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    View your progress <ExternalLink size={14} />
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Customer Dashboard CTA */}
                    {isCustomerAccount && (
                        <section className="py-6 px-5">
                            <button
                                onClick={() => router.push('/customer/dashboard')}
                                className="w-full bg-primary text-white rounded-2xl p-5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-xs text-white/80 font-medium uppercase tracking-wider">Ready to engage?</p>
                                        <p className="text-lg font-bold mt-1">Open Customer Dashboard</p>
                                    </div>
                                    <LayoutDashboard size={24} />
                                </div>
                            </button>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
