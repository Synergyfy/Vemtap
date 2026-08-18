'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    CheckCircle2, 
    Smartphone,
    ArrowRight,
    Save,
    Search,
    Sparkles,
    Camera,
    MapPin,
    Globe,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    MessageCircle,
    Mail,
    Clock,
    Eye,
    EyeOff,
    Zap,
    Shield,
    Star,
    Crown,
    Play,
    ChevronDown,
    ChevronRight,
    Trash2,
    Plus,
    X,
    Copy
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/services/categories/hooks';
import type { Category } from '@/services/categories/index';
import { getCategoryIcon } from '@/lib/category-icons';
import { useUpdateBusiness } from '@/services/businesses/hooks';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { PricingPlan } from '@/types/pricing';
import { usePricingPlans } from '@/services/pricing/hooks';
import { useSubscribe, useActiveSubscription } from '@/services/subscriptions/hooks';
import { loadPaystackScript } from '@/lib/loadPaystackScript';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuthStore } from '@/store/useAuthStore';
import { loadOnboardingProgress, saveOnboardingProgress, clearOnboardingProgress } from '@/lib/onboardingProgress';
import LocationStep from './components/LocationStep';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useReferrerInfo } from '@/services/affiliates/hooks';

// --- Utils ---
function getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error && err.message ? err.message : fallback;
}

// --- Types ---
type Step = 1 | 2 | '2A' | 3 | '3A' | 4 | 5 | '5A' | 6 | 7;

interface OnboardingData {
    category: string;
    businessName: string;
    logo: string | null;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zip: string;
    };
    description: string;
    website?: string;
    socials: {
        facebook?: string;
        instagram?: string;
        tiktok?: string;
        x?: string;
        linkedin?: string;
        whatsapp?: string;
    };
    contact: {
        phone: string;
        secondaryPhone?: string;
        email: string;
        supportEmail?: string;
        whatsapp?: string;
    };
    hours: Record<string, { open: string; close: string; isClosed: boolean; is24h: boolean }>;
    timezone: string;
    isVisible: boolean;
    planId: string;
    billingCycle?: 'monthly' | 'quarterly' | 'yearly';
    isTrial?: boolean;
    latitude?: number;
    longitude?: number;
}

interface DayHours {
    open: string;
    close: string;
    isClosed: boolean;
    is24h: boolean;
}

// Social Media Platforms Configuration
const SOCIAL_PLATFORMS = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', placeholder: 'yourbrand', prefix: 'https://instagram.com/' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', placeholder: 'yourbrand', prefix: 'https://facebook.com/' },
    { id: 'x', name: 'X / Twitter', icon: Twitter, color: 'text-slate-900', bg: 'bg-slate-50', placeholder: 'yourhandle', prefix: 'https://x.com/' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50', placeholder: 'company/yourbrand', prefix: 'https://linkedin.com/' },
    { id: 'tiktok', name: 'TikTok', icon: Smartphone, color: 'text-slate-900', bg: 'bg-slate-50', placeholder: 'yourbrand', prefix: 'https://tiktok.com/@' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50', placeholder: '2348012345678', prefix: 'https://wa.me/' },
    { id: 'youtube', name: 'YouTube', icon: Play, color: 'text-red-600', bg: 'bg-red-50', placeholder: 'channel/yourid', prefix: 'https://youtube.com/' },
    { id: 'google', name: 'Google Review', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', placeholder: 'https://g.page/r/...' },
    { id: 'custom', name: 'Custom Link', icon: Globe, color: 'text-slate-600', bg: 'bg-slate-50', placeholder: 'https://...' },
];

// --- Design Tokens (contact-page layout) ---
const INPUT_CLASS =
    'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-primary/40 transition-all';
const LABEL_CLASS = 'text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary block mb-2';
const CARD_CLASS = 'rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm';

// --- Steps Data ---
const STEPS = [
    { id: 1, label: 'Welcome', progress: 14 },
    { id: 2, label: 'Category', progress: 28 },
    { id: '2A', label: 'Confirmation', progress: 30 },
    { id: 3, label: 'Business Details', progress: 38 },
    { id: '3A', label: 'Business Location', progress: 48 },
    { id: 4, label: 'Operating Details', progress: 57 },
    { id: 5, label: 'Subscription', progress: 71 },
    { id: '5A', label: 'Plan Confirmation', progress: 75 },
    { id: 6, label: 'Payment', progress: 85 },
    { id: 7, label: 'Complete', progress: 100 },
];

export default function OnboardingPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const userId = user?.id;
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [data, setData] = useState<Partial<OnboardingData>>({});
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const refCode = searchParams?.get('ref') || null;
    const { data: referrer } = useReferrerInfo(refCode);
    const subscribe = useSubscribe();
    const [isSubscribingFree, setIsSubscribingFree] = useState(false);

    // Restore saved onboarding progress on first mount so a returning user
    // (after refresh or logout -> login) continues from where they stopped.
    useEffect(() => {
        if (!userId) return;
        const saved = loadOnboardingProgress(userId);
        if (saved?.currentStep) {
            const validSteps: Step[] = [1, 2, '2A', 3, '3A', 4, 5, '5A', 6, 7];
            const restoredStep = saved.currentStep as Step;
            if (validSteps.includes(restoredStep)) {
                // One-time restore after mount; intentionally reads sync state into React state.
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCurrentStep(restoredStep);
            }
            if (saved.data) {
                setData(saved.data as Partial<OnboardingData>);
            }
        }
        // Allow a deep link (e.g. from the dashboard activity checklist) to
        // resume onboarding at a specific step: /onboarding?step=3A
        const stepParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('step') : null;
        if (stepParam) {
            const validSteps: Step[] = [1, 2, '2A', 3, '3A', 4, 5, '5A', 6, 7];
            const target = stepParam as Step;
            if (validSteps.includes(target)) {
                setCurrentStep(target);
            }
        }
    }, [userId]);

    const handleNext = async (newData?: Partial<OnboardingData>) => {
        if (newData) setData(prev => ({ ...prev, ...newData }));
        const mergedData = newData ? { ...data, ...newData } : data;

        const nextStepMap: Record<string, Step> = {
            '1': 2,
            '2': '2A',
            '2A': 3,
            '3': '3A',
            '3A': 4,
            '4': 5,
            '5': '5A',
            '5A': 6,
            '6': 7
        };

        // Free plan: activate the plan server-side before completing so the
        // account has a persisted plan record for dashboard gating.
        if (currentStep === '5A' && mergedData.planId === 'free') {
            setIsSubscribingFree(true);
            try {
                await subscribe.mutateAsync({
                    planId: 'free',
                    billingPeriod: (mergedData.billingCycle as 'monthly' | 'quarterly' | 'yearly') || 'monthly',
                    businessId: user?.businessId,
                    isTrial: true,
                });
            } catch (err) {
                toast.error(getErrorMessage(err, 'Failed to activate free plan'));
                setIsSubscribingFree(false);
                return;
            }
            setIsSubscribingFree(false);
            setCurrentStep(7);
            saveOnboardingProgress(userId, 7, mergedData, refCode);
            return;
        }

        const nextStep = nextStepMap[currentStep.toString()];
        if (nextStep) {
            setCurrentStep(nextStep);
            saveOnboardingProgress(userId, nextStep, mergedData, refCode);
        }
    };

    const handleBack = () => {
        const backStepMap: Record<string, Step> = {
            '2': 1,
            '2A': 2,
            '3': '2A',
            '3A': 3,
            '4': '3A',
            '5': 4,
            '5A': 5,
            '6': '5A',
            '7': 6
        };
        const backStep = backStepMap[currentStep.toString()];
        if (backStep) {
            setCurrentStep(backStep);
            saveOnboardingProgress(userId, backStep, data, refCode);
        }
    };

    const handleSaveAndExit = () => {
        saveOnboardingProgress(userId, currentStep, data, refCode);
        toast.success('Progress saved. You can continue where you left off.');
        router.push('/');
    };

    const progress = STEPS.find(s => s.id === currentStep)?.progress || 0;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-text-main">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 sm:py-4">
                <div className="max-w-xl mx-auto lg:max-w-2xl xl:max-w-3xl space-y-4 sm:space-y-6">
                    {/* Top Row: Logo and Save & Exit */}
                    <div className="flex items-center justify-between pb-2 sm:pb-3">
                        <div className="flex items-center gap-4">
                            {currentStep !== 1 && currentStep !== 7 && (
                                <button 
                                    onClick={handleBack}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronLeft size={20} className="text-text-secondary" />
                                </button>
                            )}
                            <Logo className="h-6" />
                        </div>
                        {currentStep !== 7 && (
                            <button onClick={handleSaveAndExit} className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                                <Save size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Save & Exit</span>
                            </button>
                        )}
                    </div>
                    
                    {/* Progress Bar Section */}
                    {currentStep !== 7 && currentStep !== '2A' && currentStep !== '3A' && currentStep !== '5A' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary opacity-50">
                                    Step {currentStep.toString()} of 7
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                    {progress}% Complete
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-xl mx-auto lg:max-w-2xl xl:max-w-3xl px-6 pt-12">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && <WelcomeStep onNext={() => handleNext()} referrer={referrer} />}
                        {currentStep === 2 && <CategoryStep data={data} onNext={handleNext} />}
                        {currentStep === '2A' && <CategoryConfirmation onNext={() => handleNext()} />}
                        {currentStep === 3 && <DetailsStep data={data} onNext={handleNext} refCode={refCode} />}
                        {currentStep === '3A' && (
                            <LocationStep
                                address={data.address || { street: '', city: '', state: '', country: '', zip: '' }}
                                onNext={(locationData) => handleNext(locationData)}
                            />
                        )}
                        {currentStep === 4 && <OperatingStep data={data} onNext={handleNext} refCode={refCode} />}
                        {currentStep === 5 && <SubscriptionStep data={data} onNext={handleNext} />}
                        {currentStep === '5A' && <PlanConfirmation data={data} onNext={handleNext} onBack={handleBack} isSubscribingFree={isSubscribingFree} />}
                        {currentStep === 6 && <PaymentStep data={data} onNext={handleNext} />}
                        {currentStep === 7 && (
                            <CompleteStep
                                data={data}
                                onNext={() => {
                                    clearOnboardingProgress(userId);
                                    router.push('/dashboard');
                                }}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// --- Screen 1: Welcome ---
const ONBOARDING_YOUTUBE_ID = 'JUdg-g3_VSE';

function WelcomeVideo() {
    const [playing, setPlaying] = useState(false);
    const [thumbBroken, setThumbBroken] = useState(false);

    return (
        <div>
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-lg shadow-gray-200/60">
                {playing ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ONBOARDING_YOUTUBE_ID}?autoplay=1&rel=0`}
                        className="w-full h-full"
                        title="Turn Every Customer Into a Repeat Customer | VemTap"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        className="absolute inset-0 w-full h-full cursor-pointer group"
                        aria-label="Play video"
                    >
                        {!thumbBroken && (
                            <img
                                src={`https://i.ytimg.com/vi/${ONBOARDING_YOUTUBE_ID}/maxresdefault.jpg`}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    setThumbBroken(true);
                                }}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                        {thumbBroken && (
                            <span className="absolute inset-0 bg-gradient-to-br from-primary/15 via-gray-100 to-blue-100" />
                        )}
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="size-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center text-gray-900 scale-95 group-hover:scale-105 transition-transform duration-300">
                                <Play size={20} fill="currentColor" className="ml-0.5" />
                            </span>
                        </span>
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-black/50 backdrop-blur-md px-3.5 py-1.5 text-[10px] font-semibold text-white">
                            <Play size={10} fill="currentColor" />
                            Watch How VEMTAP Works — 30 seconds
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}

function WelcomeStep({ onNext, referrer }: { onNext: () => void; referrer?: { referralCode: string; businessName: string } | null }) {
    return (
        <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 md:space-y-8"
        >
            {/* Header */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full">
                    <Sparkles size={12} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                        Welcome to VEMTAP
                    </span>
                </div>
                <h1 className="text-[26px] md:text-[34px] font-bold text-text-main leading-[1.15] tracking-tight">
                    Let&apos;s help you bring your <span className="text-primary">next customer back.</span>
                </h1>
                <p className="text-sm md:text-base text-text-secondary font-normal leading-relaxed">
                    That&apos;s a promise. We&apos;ll guide you through everything you need to start capturing and reconnecting with customers.
                </p>
            </div>

            {/* Video */}
            <WelcomeVideo />

            {/* What you'll set up */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
                <div className="space-y-4 mt-1">
                    {[
                        'Complete your business profile',
                        'Manage your business presence',
                        'Choose a subscription plan',
                        'Get access to your dashboard',
                        'Start capturing customers'
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <CheckCircle2 size={14} />
                            </div>
                            <span className="text-sm font-medium text-text-main">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {referrer && (
                <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.03] p-5 md:p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Star size={20} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary mb-1">You Were Referred!</p>
                            <p className="text-sm font-semibold text-text-main">
                                You were referred by <span className="text-primary">{referrer.businessName}</span>
                            </p>
                            <p className="text-xs font-normal text-text-secondary mt-0.5">
                                Referral code: <span className="font-semibold text-text-main">{referrer.referralCode}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto lg:max-w-2xl xl:max-w-3xl">
                    <Button
                        onClick={onNext}
                        className="w-full bg-primary text-white font-semibold uppercase tracking-[0.14em] text-xs py-5 rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        Let&apos;s Get Started <ArrowRight size={16} />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 2: Select Category ---
function CategoryStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: Partial<OnboardingData>) => void }) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(data.category || '');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 12;

    const { data: categoriesData, isLoading } = useCategories({
        page: currentPage,
        limit: PAGE_SIZE,
        search: search || undefined,
    });
    const rawCategories: Category[] = categoriesData?.items || [];
    const meta = categoriesData?.meta;

    const categories = rawCategories.map((cat: Category) => {
        const icon = getCategoryIcon(cat.name);
        return { id: cat.id, label: cat.name, description: cat.description, icon };
    });

    // If search matches exactly one category, auto-select it. Adjusted during
    // render (guarded by the previous value) instead of an effect so React
    // doesn't flag a setState-in-effect.
    const singleResultId = search && categories.length === 1 ? categories[0].id : null;
    const [prevSingleResultId, setPrevSingleResultId] = useState<string | null>(null);
    if (singleResultId !== prevSingleResultId) {
        setPrevSingleResultId(singleResultId);
        if (singleResultId) {
            setSelected(singleResultId);
        }
    }

    return (
        <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                    What Type Of Business Do You Run?
                </h1>
                <p className="text-sm md:text-base text-text-secondary font-normal leading-relaxed">
                    Select the category that best describes your business.
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search Business Category"
                    className={`${INPUT_CLASS} pl-11`}
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelected(cat.id)}
                        className={`group p-4 md:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                            selected === cat.id
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 text-lg transition-colors ${
                                selected === cat.id ? 'bg-primary text-white' : 'bg-gray-50 text-text-secondary group-hover:bg-gray-100'
                            }`}>
                                {cat.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className={`text-sm font-semibold block ${selected === cat.id ? 'text-primary' : 'text-text-main'}`}>
                                    {cat.label}
                                </span>
                                <span className="text-[10px] text-text-secondary/70 font-normal mt-0.5 block line-clamp-1">
                                    {cat.description.replace(/^(Businesses that|Business Involves)\s+/i, '')}
                                </span>
                            </div>
                        </div>
                        {selected === cat.id && (
                            <motion.div
                                layoutId="check"
                                className="absolute top-3 right-3 text-primary"
                            >
                                <CheckCircle2 size={16} />
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>
            )}

            {/* Pagination */}
            {!isLoading && meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400">
                        Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="flex items-center gap-1 px-3 py-2 text-[11px] font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>
                        {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - currentPage) <= 1)
                            .reduce<(number | 'ellipsis')[]>((acc, p, _, arr) => {
                                if (acc.length > 0 && p - (arr[acc.length - 1] as number) > 1) acc.push('ellipsis');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === 'ellipsis' ? (
                                    <span key={`e${i}`} className="px-2 text-gray-300">...</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p as number)}
                                        className={`size-8 rounded-lg text-[11px] font-bold transition-all ${
                                            currentPage === p
                                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                            disabled={currentPage >= meta.totalPages}
                            className="flex items-center gap-1 px-3 py-2 text-[11px] font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto lg:max-w-2xl xl:max-w-3xl flex gap-4">
                    <Button
                        disabled={!selected}
                        onClick={() => onNext({ category: selected })}
                        className="flex-1 rounded-xl bg-primary px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 2A: Category Confirmation ---
function CategoryConfirmation({ onNext }: { onNext: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onNext, 2000);
        return () => clearTimeout(timer);
    }, [onNext]);

    return (
        <motion.div
            key="category-confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
        >
            <div className="size-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-text-main tracking-tight">Perfect!</h1>
                <p className="text-text-secondary font-medium">We&apos;ve customized Vemtap for your business type.</p>
            </div>
            <Button 
                onClick={onNext}
                variant="ghost" 
                className="text-primary font-bold uppercase tracking-wider text-[10px]"
            >
                Continue <ArrowRight size={14} className="ml-2" />
            </Button>
        </motion.div>
    );
}

// --- Screen 3: Business Details ---
function DetailsStep({ data, onNext, refCode }: { data: Partial<OnboardingData>, onNext: (d: Partial<OnboardingData>) => void, refCode?: string | null }) {
    const [localData, setLocalData] = useState({
        businessName: data.businessName || '',
        logo: data.logo || null,
        description: data.description || '',
        website: data.website || '',
        address: data.address || { street: '', city: '', state: '', country: '', zip: '' },
        socials: data.socials || {}
    });
    const [isSaving, setIsSaving] = useState(false);
    const updateBusiness = useUpdateBusiness();
    const [isSocialDropdownOpen, setIsSocialDropdownOpen] = useState(false);
    const [selectedSocial, setSelectedSocial] = useState<typeof SOCIAL_PLATFORMS[0] | null>(null);
    const [socialHandle, setSocialHandle] = useState('');
    const [activeSocials, setActiveSocials] = useState<{ id: string; name: string; icon: React.ElementType; color: string; bg: string; url: string }[]>(() => {
        const existing = data.socials || {};
        const items: { id: string; name: string; icon: React.ElementType; color: string; bg: string; url: string }[] = [];
        const platformMap: Record<string, (typeof SOCIAL_PLATFORMS[0])> = {};
        SOCIAL_PLATFORMS.forEach(p => { platformMap[p.id] = p; });
        Object.entries(existing).forEach(([id, url]) => {
            if (url && platformMap[id]) {
                const p = platformMap[id];
                items.push({ id: p.id, name: p.name, icon: p.icon, color: p.color, bg: p.bg, url: url as string });
            }
        });
        return items;
    });

    const handleAddSocial = () => {
        if (!selectedSocial || !socialHandle.trim()) return;
        const fullUrl = selectedSocial.prefix ? selectedSocial.prefix + socialHandle.trim() : socialHandle.trim();
        if (!activeSocials.some(s => s.id === selectedSocial.id)) {
            setActiveSocials(prev => [...prev, { id: selectedSocial.id, name: selectedSocial.name, icon: selectedSocial.icon, color: selectedSocial.color, bg: selectedSocial.bg, url: fullUrl }]);
        }
        setSelectedSocial(null);
        setSocialHandle('');
    };

    const removeSocial = (id: string) => {
        setActiveSocials(prev => prev.filter(s => s.id !== id));
    };

    const handleContinue = async () => {
        if (!localData.businessName || !localData.address.street) return;
        setIsSaving(true);
        try {
            const socialsMap: Record<string, string> = {};
            activeSocials.forEach(s => { socialsMap[s.id] = s.url; });

            await updateBusiness.mutateAsync({
                updates: {
                    name: localData.businessName,
                    categoryId: data.category,
                    logoUrl: localData.logo,
                    about: localData.description,
                    website: localData.website || undefined,
                    address: `${localData.address.street}, ${localData.address.city}`,
                    city: localData.address.city,
                    state: localData.address.state,
                    facebookUrl: socialsMap.facebook || undefined,
                    instagramUrl: socialsMap.instagram || undefined,
                    tiktokUrl: socialsMap.tiktok || undefined,
                    xUrl: socialsMap.x || undefined,
                    linkedinUrl: socialsMap.linkedin || undefined,
                    whatsappNumber: socialsMap.whatsapp || undefined,
                    ...(refCode ? { referralCode: refCode } : {}),
                }
            }).then((biz) => {
                // Immediately propagate the business id to the auth store so
                // dashboard gating never bounces a paid owner back to
                // onboarding. This is the authoritative source; the profile
                // re-sync below is only a best-effort follow-up for branchId.
                if (biz?.id) {
                    useAuthStore.setState((s) => ({
                        user: s.user ? { ...s.user, businessId: biz.id } : s.user,
                    }));
                }
            });

            // Sync user profile to update businessId and branchId in Zustand store
            try {
                const profile = await api.get('/users/profile');
                const token = useAuthStore.getState().access_token;
                if (token) {
                    await useAuthStore.getState().login(profile, token);
                }
            } catch (err) {
                console.error('Failed to sync user profile after business creation:', err);
            }

            onNext({ ...localData, socials: socialsMap });
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to save business details'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-20"
        >
            <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                    Tell Customers About Your Business
                </h1>
                <p className="text-sm md:text-base text-text-secondary font-normal leading-relaxed">
                    Create a complete business profile.
                </p>
            </div>

            {/* Business Logo Upload */}
            <div className="space-y-3">
                <label className={LABEL_CLASS}>Business Logo</label>
                <div className={`${CARD_CLASS} flex items-center gap-5`}>
                    <div className="size-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group cursor-pointer shrink-0">
                        {localData.logo ? (
                            <img src={localData.logo} alt="Logo Preview" className="size-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-gray-400">
                                <Camera size={20} />
                                <span className="text-[9px] font-bold">Upload</span>
                            </div>
                        )}
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const url = await uploadToCloudinary(file);
                                    setLocalData({ ...localData, logo: url });
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                        <p className="text-xs font-semibold text-text-main leading-tight">Recommended: Square PNG/JPG</p>
                        <p className="text-[10px] text-text-secondary font-normal">Max size: 2MB. We&apos;ll help you crop it.</p>
                        <div className="flex gap-3 pt-1.5">
                            <Button variant="ghost" className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-gray-50">Choose File</Button>
                            {localData.logo && (
                                <button onClick={() => setLocalData({...localData, logo: null})} className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer">Remove</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Name */}
            <div className="space-y-3">
                <label className={LABEL_CLASS}>Business Name</label>
                <input
                    type="text"
                    value={localData.businessName}
                    onChange={(e) => setLocalData({ ...localData, businessName: e.target.value })}
                    placeholder="e.g. The Coffee House"
                    className={INPUT_CLASS}
                />
            </div>

            {/* Address Section */}
            <div className="space-y-3">
                <label className={LABEL_CLASS}>Business Address</label>
                <div className="space-y-3">
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Street Address"
                            value={localData.address.street}
                            onChange={(e) => setLocalData({ ...localData, address: { ...localData.address, street: e.target.value } })}
                            className={`${INPUT_CLASS} pl-11`}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <input
                            type="text" placeholder="City"
                            value={localData.address.city}
                            onChange={(e) => setLocalData({ ...localData, address: { ...localData.address, city: e.target.value } })}
                            className={INPUT_CLASS}
                        />
                        <input
                            type="text" placeholder="State"
                            value={localData.address.state}
                            onChange={(e) => setLocalData({ ...localData, address: { ...localData.address, state: e.target.value } })}
                            className={INPUT_CLASS}
                        />
                    </div>
                </div>
            </div>

            {/* Business Description */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>Business Description</label>
                    <span className="text-[10px] font-semibold text-text-secondary opacity-40">{localData.description.length}/300</span>
                </div>
                <textarea
                    maxLength={300}
                    value={localData.description}
                    onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
                    placeholder="Tell your customers what makes your business special..."
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-primary/40 transition-all resize-none"
                />
            </div>

            {/* Website */}
            <div className="space-y-3">
                <label className={LABEL_CLASS}>Website (Optional)</label>
                <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="url"
                        value={localData.website}
                        onChange={(e) => setLocalData({ ...localData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className={`${INPUT_CLASS} pl-11`}
                    />
                </div>
            </div>

            {/* Social Media Section */}
            <div className="space-y-3">
                <label className={LABEL_CLASS}>Social Media</label>
                <div className="space-y-4">
                    <div className="relative">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <button
                                    type="button"
                                    onClick={() => setIsSocialDropdownOpen(!isSocialDropdownOpen)}
                                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center justify-between text-sm font-medium text-text-main hover:bg-gray-100 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        {selectedSocial ? (
                                            <>
                                                <div className={`p-1.5 rounded-lg bg-white shadow-sm ${selectedSocial.color}`}>
                                                    <selectedSocial.icon size={15} />
                                                </div>
                                                <span className="font-semibold">{selectedSocial.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-1.5 rounded-lg bg-white shadow-sm text-gray-400">
                                                    <Plus size={15} />
                                                </div>
                                                <span className="text-gray-400 font-normal">Select Platform</span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronDown size={15} className={`text-gray-400 transition-transform ${isSocialDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isSocialDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-[9999] overflow-hidden py-1.5"
                                    >
                                        {SOCIAL_PLATFORMS.map((platform) => {
                                            const isAlreadyAdded = activeSocials.some(s => s.id === platform.id);
                                            return (
                                                <button
                                                    key={platform.id}
                                                    type="button"
                                                    disabled={isAlreadyAdded && platform.id !== 'custom'}
                                                    onClick={() => {
                                                        setSelectedSocial(platform);
                                                        setIsSocialDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:grayscale"
                                                >
                                                    <div className={`p-1.5 rounded-lg ${platform.bg} ${platform.color}`}>
                                                        <platform.icon size={16} />
                                                    </div>
                                                    <div className="flex-1 text-left text-sm font-semibold text-text-main">
                                                        {platform.name}
                                                        {isAlreadyAdded && platform.id !== 'custom' && (
                                                            <span className="ml-2 text-[9px] uppercase tracking-wider text-green-500 font-bold">Added</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                        {selectedSocial && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 space-y-2.5 overflow-hidden"
                            >
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={socialHandle}
                                            onChange={(e) => setSocialHandle(e.target.value)}
                                            placeholder={selectedSocial.placeholder}
                                            className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 text-sm font-medium text-text-main focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            autoFocus
                                        />
                                        {selectedSocial.prefix && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-300 uppercase tracking-tighter">
                                                Handle Only
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddSocial}
                                        disabled={!socialHandle.trim()}
                                        className="h-11 px-5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedSocial(null); setSocialHandle(''); }}
                                        className="h-11 w-11 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                {selectedSocial.prefix && (
                                    <p className="text-[10px] text-gray-400 ml-1">
                                        Your profile link will be: <span className="text-primary font-semibold">{selectedSocial.prefix}{socialHandle || 'handle'}</span>
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </div>
                    {activeSocials.length > 0 && (
                        <div className="space-y-2 mt-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary ml-1">Active Links</label>
                            <div className="grid grid-cols-1 gap-2">
                                {activeSocials.map((social) => (
                                    <motion.div
                                        layout
                                        key={social.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`p-2 rounded-lg ${social.bg} ${social.color} shrink-0`}>
                                                <social.icon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-text-main uppercase tracking-tighter leading-none">{social.name}</p>
                                                <p className="text-[11px] text-text-secondary font-medium truncate mt-1">
                                                    {social.url}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSocial(social.id)}
                                            className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Profile Preview Card */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary text-center">Live Profile Preview</h3>
                <div className="max-w-[300px] mx-auto w-full bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="h-20 bg-primary/10 flex items-center justify-center">
                        <div className="size-14 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                            {localData.logo ? <img src={localData.logo} alt="Logo" className="size-full object-cover" /> : <LogoIcon className="text-primary size-7" />}
                        </div>
                    </div>
                    <div className="p-5 text-center space-y-3">
                        <div className="space-y-1">
                            <h4 className="font-bold text-base text-text-main line-clamp-1">{localData.businessName || 'Business Name'}</h4>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/5 inline-block px-3 py-1 rounded-full">
                                {data.category || 'Category'}
                            </p>
                        </div>
                        <p className="text-xs text-text-secondary font-normal line-clamp-2">
                            {localData.description || 'Your business description will appear here for customers to see.'}
                        </p>
                        <div className="flex justify-center gap-3">
                            {activeSocials.length > 0 ? (
                                activeSocials.map(social => (
                                    <div key={social.id} className="size-8 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary">
                                        <social.icon size={14} />
                                    </div>
                                ))
                            ) : (
                                <div className="text-[10px] text-text-secondary opacity-30 font-bold uppercase tracking-wider py-2">Socials appear here</div>
                            )}
                        </div>
                        <Button className="w-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-xl py-3.5">Connect With Us</Button>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto lg:max-w-2xl xl:max-w-3xl flex gap-4">
                    <Button
                        disabled={!localData.businessName || !localData.address.street || isSaving}
                        onClick={handleContinue}
                        className="flex-1 rounded-xl bg-primary px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 4: Business Operating Details ---
function OperatingStep({ data, onNext, refCode }: { data: Partial<OnboardingData>, onNext: (d: Partial<OnboardingData>) => void, refCode?: string | null }) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentUser = useAuthStore((state) => state.user);
    
    const [localData, setLocalData] = useState(() => {
        const savedContact = data.contact || { phone: '', secondaryPhone: '', email: '', supportEmail: '', whatsapp: '' };
        return {
            // Seed the contact fields with the signup email/phone so the
            // "same as signup" toggles (which default ON) are reflected from
            // the start — the disabled inputs otherwise keep the email empty.
            contact: {
                ...savedContact,
                email: currentUser?.email || savedContact.email || '',
                whatsapp: currentUser?.phone || savedContact.whatsapp || '',
            },
            hours: data.hours || days.reduce((acc, day) => ({ 
                ...acc, 
                [day]: { open: '09:00', close: '18:00', isClosed: false, is24h: false } 
            }), {} as Record<string, DayHours>),
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            isVisible: data.isVisible ?? true
        };
    });
    const [isSaving, setIsSaving] = useState(false);
    const updateBusiness = useUpdateBusiness();
    const [useSignupEmail, setUseSignupEmail] = useState(true);
    const [useSignupPhone, setUseSignupPhone] = useState(true);

    // Sync contact fields when the "same as signup" toggles change. Handled in
    // the click handlers instead of effects to avoid setState-in-effect.
    const toggleUseSignupEmail = () => {
        const next = !useSignupEmail;
        setUseSignupEmail(next);
        setLocalData(prev => {
            const contact = { ...prev.contact };
            if (next && currentUser?.email) {
                contact.email = currentUser.email;
            } else if (!next && prev.contact.email === currentUser?.email) {
                contact.email = '';
            }
            return { ...prev, contact };
        });
    };

    const toggleUseSignupPhone = () => {
        const next = !useSignupPhone;
        setUseSignupPhone(next);
        setLocalData(prev => {
            const contact = { ...prev.contact };
            if (next && currentUser?.phone) {
                contact.whatsapp = currentUser.phone;
            } else if (!next && prev.contact.whatsapp === currentUser?.phone) {
                contact.whatsapp = '';
            }
            return { ...prev, contact };
        });
    };

    const handleContinue = async () => {
        if (!localData.contact.email) return;
        setIsSaving(true);
        try {
            await updateBusiness.mutateAsync({
                updates: {
                    officialEmail: localData.contact.email,
                    whatsappNumber: localData.contact.whatsapp || undefined,
                    businessHours: Object.entries(localData.hours).reduce((acc, [day, h]) => ({
                        ...acc,
                        [day.toLowerCase()]: { from: h.open, to: h.close, isClosed: h.isClosed }
                    }), {} as Record<string, { from: string; to: string; isClosed: boolean }>),
                    timezone: localData.timezone,
                    isVisible: localData.isVisible,
                    ...(refCode ? { referralCode: refCode } : {}),
                }
            });
            onNext(localData);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to save operating details'));
        } finally {
            setIsSaving(false);
        }
    };

    const updateDay = (day: string, updates: Partial<DayHours>) => {
        setLocalData({
            ...localData,
            hours: {
                ...localData.hours,
                [day]: { ...localData.hours[day], ...updates }
            }
        });
    };

    const applyToAll = () => {
        const mon = localData.hours['Monday'];
        const newHours = days.reduce((acc, day) => ({ ...acc, [day]: { ...mon } }), {});
        setLocalData({ ...localData, hours: newHours });
    };

    return (
        <motion.div
            key="operating"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-20"
        >
            <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                    Business Operating Information
                </h1>
                <p className="text-sm md:text-base text-text-secondary font-normal leading-relaxed">
                    How and when can customers reach you?
                </p>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-3">
                <label className={LABEL_CLASS}>Contact Information</label>
                <div className="space-y-3">
                    {/* Business Email */}
                    <div className="space-y-2">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="email"
                                placeholder="Business Email"
                                value={localData.contact.email}
                                onChange={(e) => setLocalData({ ...localData, contact: { ...localData.contact, email: e.target.value } })}
                                disabled={useSignupEmail}
                                className={`${INPUT_CLASS} pl-11 disabled:opacity-60 disabled:cursor-not-allowed`}
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-1">
                            <button
                                type="button"
                                onClick={toggleUseSignupEmail}
                                className={`w-9 h-5 rounded-full transition-colors relative ${useSignupEmail ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <div className={`size-3.5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${useSignupEmail ? 'translate-x-4 left-[2px]' : 'translate-x-0.5 left-0'}`} />
                            </button>
                            <span className="text-[10px] font-medium text-text-secondary">Same as signup email{useSignupEmail && currentUser?.email ? ` (${currentUser.email})` : ''}</span>
                        </div>
                    </div>
                    {/* WhatsApp Business Number */}
                    <div className="space-y-2">
                        <div className="relative">
                            <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="tel"
                                placeholder="WhatsApp Business Number"
                                value={localData.contact.whatsapp}
                                onChange={(e) => setLocalData({ ...localData, contact: { ...localData.contact, whatsapp: e.target.value } })}
                                disabled={useSignupPhone}
                                className={`${INPUT_CLASS} pl-11 disabled:opacity-60 disabled:cursor-not-allowed`}
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-1">
                            <button
                                type="button"
                                onClick={toggleUseSignupPhone}
                                className={`w-9 h-5 rounded-full transition-colors relative ${useSignupPhone ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <div className={`size-3.5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${useSignupPhone ? 'translate-x-4 left-[2px]' : 'translate-x-0.5 left-0'}`} />
                            </button>
                            <span className="text-[10px] font-medium text-text-secondary">Same as signup phone{useSignupPhone && currentUser?.phone ? ` (${currentUser.phone})` : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Opening Hours Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>Opening Hours</label>
                    <button
                        type="button"
                        onClick={applyToAll}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline cursor-pointer transition-colors"
                    >
                        <Copy size={12} />
                        Copy Monday
                    </button>
                </div>

                <div className="space-y-3">
                    {days.map((day) => {
                        const h = localData.hours[day];
                        const isClosed = !!h.isClosed;
                        const is24h = !!h.is24h;
                        return (
                            <div key={day} className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">{day}</h4>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => updateDay(day, { is24h: !is24h, isClosed: false })}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                                is24h
                                                    ? 'bg-primary text-white border-primary shadow-sm'
                                                    : 'bg-white text-text-secondary/70 border-gray-200 hover:border-primary/40'
                                            }`}
                                        >
                                            24 Hours
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateDay(day, { isClosed: !isClosed, is24h: false })}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                                isClosed
                                                    ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                                    : 'bg-white text-text-secondary/70 border-gray-200 hover:border-red-300'
                                            }`}
                                        >
                                            Closed
                                        </button>
                                    </div>
                                </div>

                                {isClosed ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                                        <Clock size={14} /> Closed on {day}
                                    </div>
                                ) : is24h ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                        <Clock size={14} /> Open 24 Hours
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0" onClick={(e) => (e.currentTarget.querySelector<HTMLInputElement>('input[type="time"]')?.showPicker())}>
                                            <label className={LABEL_CLASS}>Open</label>
                                            <input
                                                type="time"
                                                value={h.open}
                                                onChange={(e) => updateDay(day, { open: e.target.value })}
                                                className={`${INPUT_CLASS} cursor-pointer min-w-0`}
                                            />
                                        </div>
                                        <span className="mt-9 text-sm font-bold text-gray-300 shrink-0">—</span>
                                        <div className="flex-1 min-w-0" onClick={(e) => (e.currentTarget.querySelector<HTMLInputElement>('input[type="time"]')?.showPicker())}>
                                            <label className={LABEL_CLASS}>Close</label>
                                            <input
                                                type="time"
                                                value={h.close}
                                                onChange={(e) => updateDay(day, { close: e.target.value })}
                                                className={`${INPUT_CLASS} cursor-pointer min-w-0`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Timezone Selector */}
            <div className="space-y-3">
                <label className={LABEL_CLASS}>Timezone</label>
                <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                        value={localData.timezone}
                        onChange={(e) => setLocalData({ ...localData, timezone: e.target.value })}
                        className={`${INPUT_CLASS} pl-11 appearance-none`}
                    >
                        <option value={localData.timezone}>{localData.timezone} (Auto-detected)</option>
                        {/* More timezones could be added here */}
                    </select>
                </div>
            </div>

            {/* Visibility Toggle */}
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5 md:p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                        {localData.isVisible ? <Eye size={16} className="text-primary" /> : <EyeOff size={16} className="text-text-secondary" />}
                        Business Visibility
                    </h3>
                    <p className="text-xs text-text-secondary font-medium">
                        {localData.isVisible ? 'Your profile is visible to customers' : 'Your profile is hidden while you set up'}
                    </p>
                </div>
                <Switch
                    checked={localData.isVisible}
                    onCheckedChange={(val) => setLocalData({ ...localData, isVisible: val })}
                />
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto lg:max-w-2xl xl:max-w-3xl">
                    <Button
                        disabled={!localData.contact.email || isSaving}
                        onClick={handleContinue}
                        className="w-full rounded-xl bg-primary px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// Helper function to format limit strings
const formatLimit = (value: number | string | undefined | null, label: string) => {
    if (value === undefined || value === null || value === 0 || value === '0') return null;
    if (value === -1 || value === 'unlimited') return `Unlimited ${label}`;
    return `${value} ${label}`;
};

// Helper function to extract all features and limits configured for a plan
const normalizePlanFeatures = (plan: PricingPlan) => {
    const baseFeatures = Array.isArray(plan.features) ? plan.features.filter(Boolean) : [];
    const derivedFeatures: string[] = [];

    const smsCredits = formatLimit(plan.smsCredits, 'SMS Credits');
    const whatsappCredits = formatLimit(plan.whatsappCredits, 'WhatsApp Credits');
    const emailCredits = formatLimit(plan.emailCredits, 'Email Credits');
    const teamMembersLimit = formatLimit(plan.teamMembersLimit, 'Team Members');
    const loyaltyLimit = formatLimit(plan.loyaltyLimit, 'Loyalty Points');
    const branchLimit = formatLimit(plan.branchLimit, 'Branches');
    const catalogueLimit = formatLimit(plan.maxCatalogueItems, 'Catalogue Items');
    const posLimit = formatLimit(plan.posTerminalLimit, 'POS Terminals');
    const inventoryLimit = formatLimit(plan.inventoryLimit, 'Inventory Items');
    const formsLimit = formatLimit(plan.formsLimit, 'Custom Forms');
    const aiCredits = formatLimit(plan.aiCredits, 'AI Copilot Credits');
    const marketingKitLimit = formatLimit(plan.marketingKitLimit, 'Marketing Kits');
    const qrCodesLimit = formatLimit(plan.qrCodesLimit, 'QR Codes');

    if (smsCredits) derivedFeatures.push(smsCredits);
    if (whatsappCredits) derivedFeatures.push(whatsappCredits);
    if (emailCredits) derivedFeatures.push(emailCredits);
    if (teamMembersLimit) derivedFeatures.push(teamMembersLimit);
    if (loyaltyLimit) derivedFeatures.push(loyaltyLimit);
    if (branchLimit) derivedFeatures.push(branchLimit);
    if (catalogueLimit) derivedFeatures.push(catalogueLimit);
    if (posLimit) derivedFeatures.push(posLimit);
    if (inventoryLimit) derivedFeatures.push(inventoryLimit);
    if (formsLimit) derivedFeatures.push(formsLimit);
    if (aiCredits) derivedFeatures.push(aiCredits);
    if (marketingKitLimit) derivedFeatures.push(marketingKitLimit);
    if (qrCodesLimit) derivedFeatures.push(qrCodesLimit);

    if (plan.analyticsLevel && plan.analyticsLevel !== 'none') {
        derivedFeatures.push(`${plan.analyticsLevel.charAt(0).toUpperCase() + plan.analyticsLevel.slice(1)} Analytics`);
    }

    if (plan.automationsEnabled) derivedFeatures.push('Automated Messaging & Campaigns');
    if (plan.inAppChatEnabled) derivedFeatures.push('In-App Customer Live Chat');
    if (plan.visitorsEnabled) derivedFeatures.push('Visitor Analytics & Insights');
    if (plan.activityLogEnabled) derivedFeatures.push('Activity Audit Logging');
    if (plan.staffRolesEnabled) derivedFeatures.push('Custom Staff Roles & Permissions');
    if (plan.discoveryEnabled) derivedFeatures.push('Public Directory Listing');

    return {
        base: baseFeatures,
        limits: derivedFeatures,
    };
};

// --- Screen 5: Subscription Selection ---
function SubscriptionStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: Partial<OnboardingData>) => void }) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [selectedPlan, setSelectedPlan] = useState(data.planId || '');
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
    const { data: plans = [], isLoading: plansLoading } = usePricingPlans();
    const activePlans = plans
        .filter((p: PricingPlan) => p.isActive)
        .sort((a: PricingPlan, b: PricingPlan) => {
            const rank = (p: PricingPlan) => p.isFree ? 0 : ((p.monthlyPrice || 0) === 0 ? Number.MAX_SAFE_INTEGER : (p.monthlyPrice || 0));
            return rank(a) - rank(b);
        });

    const getPrice = (plan: PricingPlan) => {
        if (plan.isFree) return 0;
        if (billingCycle === 'yearly') return plan.yearlyPrice || plan.monthlyPrice * 12;
        if (billingCycle === 'quarterly') return plan.quarterlyPrice || plan.monthlyPrice * 3;
        return plan.monthlyPrice;
    };

    const getPeriodLabel = (plan: PricingPlan) => {
        if (plan.isFree) return '';
        if (billingCycle === 'yearly') return '/yr';
        if (billingCycle === 'quarterly') return '/qtr';
        return '/mo';
    };

    const getDiscount = (cycle: string) => {
        if (cycle === 'yearly') return 'Save 20%';
        if (cycle === 'quarterly') return 'Save 10%';
        return null;
    };

    const getSavings = (plan: PricingPlan, cycle: string) => {
        if (plan.isFree) return null;
        const monthly = plan.monthlyPrice;
        if (cycle === 'yearly') {
            const total = plan.yearlyPrice || monthly * 12;
            const saved = monthly * 12 - total;
            return saved > 0 ? `Save ₦${saved.toLocaleString()}/yr` : null;
        }
        if (cycle === 'quarterly') {
            const total = plan.quarterlyPrice || monthly * 3;
            const saved = monthly * 3 - total;
            return saved > 0 ? `Save ₦${saved.toLocaleString()}/qtr` : null;
        }
        return null;
    };

    // Cross-sell totals shown under the price depending on the active cycle.
    // Monthly: show quarter + yearly totals with % off. Quarterly: show yearly.
    // Yearly: show nothing.
    const getCrossSell = (plan: PricingPlan) => {
        if (plan.isFree) return [];
        const monthly = plan.monthlyPrice;
        if (billingCycle === 'monthly') {
            const q = plan.quarterlyPrice || monthly * 3;
            const y = plan.yearlyPrice || monthly * 12;
            return [
                { label: 'Quarter', total: q, period: '/qtr', save: q < monthly * 3 ? '10% off' : null },
                { label: 'Yearly', total: y, period: '/yr', save: y < monthly * 12 ? '20% off' : null },
            ];
        }
        if (billingCycle === 'quarterly') {
            const y = plan.yearlyPrice || monthly * 12;
            return y < monthly * 12 ? [{ label: 'Yearly', total: y, period: '/yr', save: '20% off' }] : [];
        }
        return [];
    };

    const isCustomPricePlan = (plan: PricingPlan) => !plan.isFree && plan.monthlyPrice === 0;

    const handleEnterpriseInquiry = () => {
        const subject = encodeURIComponent('Enterprise Plan Inquiry - Vemtap');
        const body = encodeURIComponent(
            'Hi Vemtap Team,\n\n' +
            'I would like to learn more about the Enterprise plan and discuss a custom pricing solution for my business.\n\n' +
            'Please get in touch with details on:\n' +
            '- Custom pricing options\n' +
            '- Enterprise features & limits\n' +
            '- Onboarding process\n\n' +
            'Thank you.'
        );
        window.open(`mailto:support@vemtap.com?subject=${subject}&body=${body}`, '_self');
    };

    const handleSelectPlan = (planId: string, isTrial: boolean) => {
        setSelectedPlan(planId);
        onNext({ planId, billingCycle, isTrial });
    };

    const toggleFeatures = (planId: string) => {
        setExpandedPlanId(prev => (prev === planId ? null : planId));
    };

    return (
        <motion.div
            key="subscription"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-32 md:pb-20"
        >
            <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Transparent Pricing</span>
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                    Choose Your Subscription Plan
                </h1>
                <p className="text-sm md:text-base text-text-secondary font-normal max-w-md mx-auto leading-relaxed">
                    Select a plan to launch your business. Start with a free trial or subscribe directly.
                </p>
            </div>

            {/* Billing Cycle Tabs */}
            <div className="flex justify-center">
                <div className="bg-gray-100/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                    {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setBillingCycle(cycle)}
                            className={`relative px-4 md:px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                billingCycle === cycle
                                    ? 'bg-white shadow-md text-primary'
                                    : 'text-text-secondary/70 hover:text-text-main'
                            }`}
                        >
                            {cycle === 'monthly' ? 'Monthly' : cycle === 'quarterly' ? 'Quarterly' : 'Yearly'}
                            {getDiscount(cycle) && (
                                <span className="block text-[7px] text-emerald-600 font-bold tracking-wide -mt-0.5">
                                    {getDiscount(cycle)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {plansLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : activePlans.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-text-secondary font-medium">No plans available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
                    {activePlans.map((plan: PricingPlan) => {
                        const isSelected = selectedPlan === plan.id;
                        const isPopular = plan.isPopular;
                        const price = getPrice(plan);
                        const periodLabel = getPeriodLabel(plan);
                        const savings = getSavings(plan, billingCycle);
                        const crossSell = getCrossSell(plan);
                        const trialDays = plan.isFree ? 0 : (plan.trialDurationDays || plan.freeDurationDays || 0);
                        const features = normalizePlanFeatures(plan);
                        const isExpanded = expandedPlanId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl border bg-white transition-all duration-300 flex flex-col ${
                                    isSelected
                                        ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/10'
                                        : isPopular
                                            ? 'border-primary/30 shadow-md hover:shadow-lg'
                                            : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                                }`}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                        <div className="px-4 py-1 bg-primary text-white text-[9px] font-bold uppercase tracking-[0.14em] rounded-full shadow-md shadow-primary/30 whitespace-nowrap">
                                            Most Popular Choice
                                        </div>
                                    </div>
                                )}

                                {/* Card Header */}
                                <div className={`rounded-t-2xl p-5 md:p-6 ${isSelected && isPopular ? 'bg-primary text-white' : 'bg-white'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className={`text-lg font-bold ${isSelected && isPopular ? 'text-white' : 'text-text-main'}`}>
                                                {plan.name}
                                            </h3>
                                            {plan.description && (
                                                <p className={`text-xs font-medium mt-1 ${isSelected && isPopular ? 'text-white/80' : 'text-text-secondary'}`}>
                                                    {plan.description}
                                                </p>
                                            )}
                                        </div>
                                        {plan.isFree ? (
                                            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                                Free Forever
                                            </div>
                                        ) : isCustomPricePlan(plan) ? (
                                            <div className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[9px] font-bold uppercase tracking-wider shrink-0 border border-purple-200">
                                                Custom Pricing
                                            </div>
                                        ) : trialDays > 0 && (
                                            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wider shrink-0 border border-amber-500/20">
                                                <Zap size={11} className="fill-amber-500 text-amber-500" />
                                                {trialDays}-Day Trial
                                            </div>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className={`flex items-baseline gap-1 ${isSelected && isPopular ? 'text-white' : 'text-text-main'}`}>
                                        {plan.isFree ? (
                                            <span className="text-3xl font-bold">Free</span>
                                        ) : isCustomPricePlan(plan) ? (
                                            <span className="text-3xl font-bold tracking-tight">Custom</span>
                                        ) : (
                                            <>
                                                <span className="text-3xl font-bold tracking-tight">₦{price.toLocaleString()}</span>
                                                {periodLabel && (
                                                    <span className={`text-xs font-semibold ${isSelected && isPopular ? 'text-white/70' : 'text-text-secondary/70'}`}>
                                                        {periodLabel}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Savings for active cycle */}
                                    {savings && (
                                        <p className={`text-[11px] font-bold mt-1 ${isSelected && isPopular ? 'text-white/80' : 'text-emerald-600'}`}>
                                            {savings}
                                        </p>
                                    )}

                                    {/* Cross-sell totals */}
                                    {crossSell.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {crossSell.map((cs, i) => (
                                                <div key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${isSelected && isPopular ? 'bg-white/15 text-white' : 'bg-primary/5 text-primary'}`}>
                                                    ₦{cs.total.toLocaleString()}{cs.period}
                                                    {cs.save && (
                                                        <span className={`font-bold ${isSelected && isPopular ? 'text-emerald-300' : 'text-emerald-600'}`}>{cs.save}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Features toggle */}
                                <div className={`px-5 md:px-6 pb-4 ${isSelected && isPopular ? 'bg-primary/5' : 'bg-gray-50/40'}`}>
                                    <button
                                        onClick={() => toggleFeatures(plan.id)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {isExpanded ? 'Hide Features' : 'View Features & Limits'}
                                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-4"
                                        >
                                            {/* Included Features */}
                                            {features.base.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary/70 mb-2.5">
                                                        Key Included Features
                                                    </p>
                                                    <div className="space-y-2">
                                                        {features.base.map((feature: string, i: number) => (
                                                            <div key={`base-${i}`} className="flex items-start gap-2.5">
                                                                <div className="size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                                                                    <CheckCircle2 size={11} strokeWidth={3} />
                                                                </div>
                                                                <span className="text-xs font-semibold text-text-main leading-snug">
                                                                    {feature}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Derived Capabilities & Limits */}
                                            {features.limits.length > 0 && (
                                                <div className="pt-3 border-t border-gray-200/60">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary/70 mb-2.5">
                                                        Plan Limits & Capacities
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {features.limits.map((item: string, i: number) => (
                                                            <div key={`limit-${i}`} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100">
                                                                <div className="size-1.5 rounded-full bg-primary shrink-0" />
                                                                <span className="text-[11px] font-bold text-text-main line-clamp-1">
                                                                    {item}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="p-5 md:px-6 bg-white border-t border-gray-100 space-y-2.5 mt-auto">
                                    {isCustomPricePlan(plan) ? (
                                        <button
                                            onClick={handleEnterpriseInquiry}
                                            className="w-full py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20"
                                        >
                                            <Mail size={14} />
                                            Chat With Sales
                                        </button>
                                    ) : trialDays > 0 && !plan.isFree ? (
                                        <>
                                            <button
                                                onClick={() => handleSelectPlan(plan.id, true)}
                                                className="w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <Zap size={13} className="fill-white" />
                                                Start {trialDays}-Day Free Trial
                                            </button>
                                            <button
                                                onClick={() => handleSelectPlan(plan.id, false)}
                                                className="w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all bg-gray-900 text-white hover:bg-black shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                Subscribe Now (₦{price.toLocaleString()})
                                                <ArrowRight size={13} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(plan.id, false)}
                                            className={`w-full py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                    : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
                                            }`}
                                        >
                                            {plan.isFree ? 'Choose Free Plan' : `Subscribe Now (₦${price.toLocaleString()})`}
                                            <ArrowRight size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}

// --- Screen 5A: Plan Confirmation ---
function PlanConfirmation({ data, onNext, onBack, isSubscribingFree }: { data: Partial<OnboardingData>, onNext: (d: Partial<OnboardingData>) => void, onBack: () => void, isSubscribingFree?: boolean }) {
    const plan = useSubscriptionStore((s) => s.getPlan(data.planId));
    const isTrial = data.isTrial || false;
    const trialDays = plan?.isFree ? 0 : (plan?.trialDurationDays || plan?.freeDurationDays || 14);
    const features = plan ? normalizePlanFeatures(plan) : { base: [], limits: [] };
    const [cycle, setCycle] = useState<'monthly' | 'quarterly' | 'yearly'>(data.billingCycle || 'monthly');

    const getCyclePrice = (c: 'monthly' | 'quarterly' | 'yearly') => {
        if (!plan || plan.isFree) return 0;
        if (c === 'yearly') return plan.yearlyPrice || plan.monthlyPrice * 12;
        if (c === 'quarterly') return plan.quarterlyPrice || plan.monthlyPrice * 3;
        return plan.monthlyPrice;
    };

    const getCyclePeriod = (c: 'monthly' | 'quarterly' | 'yearly') => {
        if (!plan || plan.isFree) return '';
        if (c === 'yearly') return '/yr';
        if (c === 'quarterly') return '/qtr';
        return '/mo';
    };

    const cycleSavings = [
        { cycle: 'monthly' as const, label: 'Monthly' },
        { cycle: 'quarterly' as const, label: 'Quarterly', save: 'Save 10%' },
        { cycle: 'yearly' as const, label: 'Yearly', save: 'Save 20%' },
    ];

    // Only update local state — the billing cycle is committed to the parent
    // when the user clicks "Proceed to Payment". Advancing here (via onNext)
    // caused the cycle tabs to jump straight to the payment step.
    const selectCycle = (c: 'monthly' | 'quarterly' | 'yearly') => {
        setCycle(c);
    };

    return (
        <motion.div
            key="plan-confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-6"
        >
            <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Confirm Selection</span>
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                    {isTrial ? `Start ${trialDays}-Day Free Trial` : `Subscribe to ${plan?.name || 'Selected'} Plan`}
                </h1>
                <p className="text-sm text-text-secondary font-medium max-w-sm mx-auto leading-relaxed">
                    {isTrial
                        ? `You are starting a ${trialDays}-day free trial. You won't be charged the subscription fee until your trial expires.`
                        : 'Review your selected plan and pick how you want to pay.'}
                </p>
            </div>

            {/* Billing cycle + savings buttons */}
            {!plan?.isFree && (
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                    {cycleSavings.map((opt) => (
                        <button
                            key={opt.cycle}
                            onClick={() => selectCycle(opt.cycle)}
                            className={`rounded-xl border px-2 py-3 text-center transition-all cursor-pointer ${
                                cycle === opt.cycle
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${cycle === opt.cycle ? 'text-primary' : 'text-text-main'}`}>{opt.label}</p>
                            <p className="text-sm font-bold text-text-main mt-1">₦{getCyclePrice(opt.cycle).toLocaleString()}{getCyclePeriod(opt.cycle)}</p>
                            {opt.save ? (
                                <p className="text-[9px] font-bold text-emerald-600">{opt.save}</p>
                            ) : (
                                <p className="text-[9px] font-semibold text-text-secondary opacity-40">Standard</p>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden text-left space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3.5">
                        <div className="size-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                            {isTrial ? <Zap size={22} className="fill-primary" /> : <Crown size={22} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-text-main">{plan?.name || data.planId}</h3>
                            <p className="text-xs text-text-secondary font-medium">
                                {plan?.isFree ? 'Free Forever' : `Billed ${cycle === 'yearly' ? 'yearly' : cycle === 'quarterly' ? 'quarterly' : 'monthly'}`}
                            </p>
                        </div>
                    </div>
                    {isTrial ? (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider rounded-full">
                            {trialDays}-Day Trial
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider rounded-full">
                            {plan?.isFree ? 'Free' : 'Direct Sub'}
                        </span>
                    )}
                </div>

                {/* Price */}
                {!plan?.isFree && (
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-main tracking-tight">₦{getCyclePrice(cycle).toLocaleString()}</span>
                        <span className="text-xs font-semibold text-text-secondary/70">{getCyclePeriod(cycle)}</span>
                        {cycle !== 'monthly' && cycleSavings.find(o => o.cycle === cycle)?.save && (
                            <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {cycleSavings.find(o => o.cycle === cycle)?.save}
                            </span>
                        )}
                    </div>
                )}

                {/* Trial Explanation / Notice */}
                {isTrial && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 space-y-2">
                        <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                            <Shield size={14} className="text-amber-600" /> Bank Details & Card Verification Notice
                        </p>
                        <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                            A ₦100 refundable bank verification deposit is required via Paystack to authorize your payment card. Your free trial is active for {trialDays} days. Auto-deduction will begin when your free trial ends unless cancelled.
                        </p>
                    </div>
                )}

                {/* Key Plan Features list */}
                <div className="space-y-3 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">Plan Inclusions</p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                        {[...features.base, ...features.limits].map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-text-main">
                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-2 max-w-md mx-auto">
                <Button
                    onClick={() => onNext({ billingCycle: cycle })}
                    disabled={isSubscribingFree}
                    className="w-full rounded-xl bg-primary px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                >
                    {isSubscribingFree ? (
                        <>
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Activating Plan...
                        </>
                    ) : plan?.isFree ? 'Complete Free Setup' : isTrial ? 'Proceed to Bank Verification (₦100)' : 'Proceed to Payment'}
                    {!isSubscribingFree && <ArrowRight size={16} />}
                </Button>
                <button
                    onClick={onBack}
                    className="text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                    Change Plan Or Billing Cycle
                </button>
            </div>
        </motion.div>
    );
}

// --- Screen 6: Payment Screen ---
function PaymentStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: Partial<OnboardingData>) => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [chargedAmount, setChargedAmount] = useState<number | null>(null);
    const { user } = useAuthStore();
    const plan = useSubscriptionStore((s) => s.getPlan(data.planId));
    const subscribe = useSubscribe();
    const { data: activeSubscription, isLoading: subscriptionLoading } = useActiveSubscription();
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const advancedRef = useRef(false);
    const payingRef = useRef(false);

    const isTrialMode = data.isTrial || false;
    const billingCycle = data.billingCycle || 'monthly';
    const planPrice = plan?.isFree ? 0 : billingCycle === 'yearly'
        ? (plan?.yearlyPrice || (plan?.monthlyPrice || 0) * 12)
        : billingCycle === 'quarterly'
            ? (plan?.quarterlyPrice || (plan?.monthlyPrice || 0) * 3)
            : (plan?.monthlyPrice || 0);

    const subtotal = isTrialMode ? 100 : planPrice;
    const total = chargedAmount ?? subtotal;
    const tax = !isTrialMode && chargedAmount != null ? chargedAmount - planPrice : 0;

    const clearPoll = () => {
        if (pollTimer.current) {
            clearInterval(pollTimer.current);
            pollTimer.current = null;
        }
    };

    const advance = useCallback(() => {
        if (advancedRef.current) return;
        advancedRef.current = true;
        onNext({});
    }, [onNext]);

    // If the webhook already activated the subscription (e.g. bank transfer
    // completed while the user was on this screen), advance without re-charging.
    // Never fire while a payment is in flight (handlePay) — doing so unmounts
    // PaymentStep mid-checkout and skips the Paystack popup entirely.
    useEffect(() => {
        if (payingRef.current) return;
        if (plan?.isFree) return;
        if (subscriptionLoading || !activeSubscription || !plan) return;
        const active =
            activeSubscription.status === 'active' ||
            activeSubscription.status === 'trial';
        if (active && activeSubscription.planId === plan.id) {
            advance();
        }
    }, [activeSubscription, subscriptionLoading, plan, advance]);

    useEffect(() => () => clearPoll(), []);

    // Preload the Paystack script while the payment screen is visible so the
    // checkout opens synchronously with the click (no async gap / focus loss).
    useEffect(() => {
        if (plan?.isFree) return;
        loadPaystackScript().catch(() => {});
    }, [plan]);

    // Fetch the exact server-computed total (plan + tax) so the summary matches
    // what will actually be charged. The trial deposit is a flat ₦100.
    useEffect(() => {
        if (!plan || plan.isFree || isTrialMode) return;
        let cancelled = false;
        api.get('/subscriptions/price-preview', {
            params: { planId: plan.id, billingPeriod: billingCycle },
        }).then((res) => {
            if (cancelled) return;
            if (typeof res?.total === 'number') {
                setChargedAmount(res.total);
            }
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [plan, isTrialMode, billingCycle]);

    const activateSubscription = (reference: string) =>
        subscribe.mutateAsync({
            planId: plan!.id,
            billingPeriod: billingCycle,
            businessId: user?.businessId,
            isTrial: isTrialMode,
            paymentReference: reference,
        });

    const handleConfirmed = async (reference: string) => {
        try {
            await activateSubscription(reference);
            setIsPending(false);
            setIsSuccess(true);
            setTimeout(() => onNext({}), 2000);
        } catch (e) {
            toast.error(getErrorMessage(e, 'Payment confirmed but activation failed. Please retry.'));
            setIsPending(false);
            setIsProcessing(false);
        }
    };

    const checkPayment = async (reference: string): Promise<'success' | 'pending' | 'failed' | 'error'> => {
        try {
            const res = await api.get(`/payments/verify/${reference}`);
            if (res?.success === true) return 'success';
            if (res?.status === 'pending') return 'pending';
            if (res?.status === 'failed' || res?.status === 'abandoned') return 'failed';
            return 'error';
        } catch {
            return 'error';
        }
    };

    const pollForPayment = async (reference: string) => {
        clearPoll();
        const outcome = await checkPayment(reference);
        if (outcome === 'success') {
            await handleConfirmed(reference);
            return;
        }
        if (outcome === 'failed') {
            setIsPending(false);
            toast.error('Payment was not completed. Please try again.');
            return;
        }
        // pending (or transient error): show the waiting state and poll.
        setIsPending(true);
        let attempts = 0;
        const maxAttempts = 120; // ~10 min at 5s intervals
        pollTimer.current = setInterval(async () => {
            attempts += 1;
            const res = await checkPayment(reference);
            if (res === 'success') {
                clearPoll();
                await handleConfirmed(reference);
                return;
            }
            if (res === 'failed') {
                clearPoll();
                setIsPending(false);
                toast.error('Payment was not completed. Please try again.');
                return;
            }
            if (attempts >= maxAttempts) {
                clearPoll();
                setIsPending(false);
                toast.error('We could not confirm your payment yet. It may still be processing — please contact support.');
            }
        }, 5000);
    };

    const handlePay = async () => {
        if (!plan) {
            toast.error('Plan details are still loading. Please try again.');
            return;
        }

        if (plan.isFree) {
            setIsProcessing(true);
            try {
                await subscribe.mutateAsync({
                    planId: plan.id,
                    billingPeriod: billingCycle,
                    businessId: user?.businessId,
                    isTrial: true,
                });
                setIsProcessing(false);
                setIsSuccess(true);
                setTimeout(() => onNext({}), 2000);
            } catch (err) {
                toast.error(getErrorMessage(err, 'Failed to activate plan'));
                setIsProcessing(false);
            }
            return;
        }

        // If the user already has an active/trial subscription to this plan
        // (e.g. the webhook fired or they were bounced back after paying),
        // don't charge them again — just advance.
        const alreadyActive =
            !subscriptionLoading &&
            !!activeSubscription &&
            (activeSubscription.status === 'active' || activeSubscription.status === 'trial') &&
            activeSubscription.planId === plan.id;
        if (alreadyActive) {
            advance();
            return;
        }

        // Flag the payment as in-flight so the auto-advance effect above cannot
        // unmount this component (and skip the Paystack popup) mid-checkout.
        payingRef.current = true;
        setIsProcessing(true);
        try {
            // Server-side initialization: the backend computes the exact amount
            // and returns an access_code. No secret key is exposed to the client.
            const init = await api.post('/subscriptions/initialize-payment', {
                planId: plan.id,
                billingPeriod: billingCycle,
                businessId: user?.businessId,
                isTrial: isTrialMode,
            });
            const accessCode: string | undefined = init?.access_code;
            const reference: string | undefined = init?.reference;
            if (!accessCode || !reference) {
                throw new Error('Payment could not be initialized');
            }
            if (typeof init?.amount === 'number') {
                setChargedAmount(init.amount);
            }

            await loadPaystackScript();
            // @ts-expect-error PaystackPop is attached to window by loadPaystackScript()
            const popup = new window.PaystackPop();
            popup.resumeTransaction(accessCode, {
                onSuccess: (transaction: { reference?: string }) => {
                    const ref = transaction?.reference || reference;
                    activateSubscription(ref)
                        .then(() => {
                            payingRef.current = false;
                            setIsProcessing(false);
                            setIsSuccess(true);
                            setTimeout(() => onNext({}), 2000);
                        })
                        .catch((err) => {
                            payingRef.current = false;
                            toast.error(getErrorMessage(err, 'Payment verified but subscription sync failed'));
                            setIsProcessing(false);
                        });
                },
                onCancel: () => {
                    // Could be a cancelled card OR a bank transfer the customer
                    // has just initiated. Confirm via the verify endpoint.
                    payingRef.current = false;
                    setIsProcessing(false);
                    pollForPayment(reference);
                },
                onError: (error: { message?: string }) => {
                    payingRef.current = false;
                    toast.error(error?.message || 'Payment could not be loaded');
                    setIsProcessing(false);
                },
            });
        } catch (err) {
            payingRef.current = false;
            toast.error(getErrorMessage(err, 'Failed to initialize payment'));
            setIsProcessing(false);
        }
    };

    if (isProcessing) {
        return (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="size-24 border-8 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                        {isTrialMode ? 'Verifying Bank Card...' : 'Processing Payment...'}
                    </h1>
                    <p className="text-text-secondary font-medium">Please complete the Paystack transaction. Do not close this page.</p>
                </div>
            </motion.div>
        );
    }

    if (isPending) {
        return (
            <motion.div key="pending" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="size-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-100">
                    <Clock size={48} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">Waiting For Your Payment</h1>
                    <p className="text-text-secondary font-medium max-w-sm">
                        Complete your transfer and we&apos;ll activate your account automatically. This page updates on its own.
                    </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button
                        onClick={() => setIsPending(false)}
                        variant="outline"
                        className="w-full text-text-main font-bold uppercase tracking-wider text-[10px] py-4 rounded-xl cursor-pointer"
                    >
                        Cancel
                    </Button>
                </div>
            </motion.div>
        );
    }

    if (isSuccess) {
        return (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="size-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                        {isTrialMode ? 'Bank Verified & Trial Activated! 🎉' : 'Payment Successful! 🎉'}
                    </h1>
                    <p className="text-text-secondary font-medium max-w-sm">
                        {isTrialMode
                            ? 'Your bank details have been verified and your free trial is now active.'
                            : 'Your subscription has been activated successfully.'}
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 pb-20"
        >
            <div className="space-y-3 text-center">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Secure Payment Gateway</span>
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                    {isTrialMode ? 'Bank Details & Verification Deposit' : 'Complete Your Subscription'}
                </h1>
                <p className="text-sm text-text-secondary font-normal max-w-md mx-auto leading-relaxed">
                    {isTrialMode
                        ? 'Authorize your bank card for auto-deduction after your free trial ends.'
                        : 'Secure checkout powered by Paystack.'}
                </p>
            </div>

            {/* Order Summary Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5 max-w-md mx-auto">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">Order Summary</span>
                    <Badge variant="outline" className="border-primary/20 text-primary capitalize font-bold">{plan?.name || data.planId}</Badge>
                </div>

                {isTrialMode ? (
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm font-semibold text-text-main">
                            <span>Plan Trial ({plan?.name})</span>
                            <span className="text-emerald-600 font-bold">Free Trial</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-text-main">
                            <span>Bank Card Verification Deposit</span>
                            <span>₦100</span>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1.5">
                            <p className="font-bold text-text-main flex items-center gap-1.5">
                                <Shield size={14} className="text-primary" /> Auto-Renewal Schedule
                            </p>
                            <p className="text-text-secondary text-[11px] leading-relaxed">
                                After your trial expires, ₦{planPrice.toLocaleString()} will be automatically charged {billingCycle === 'yearly' ? 'annually' : billingCycle === 'quarterly' ? 'quarterly' : 'monthly'}.
                            </p>
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-bold text-primary">
                            <span>Deposit Amount</span>
                            <span>₦100</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <div className="flex justify-between text-sm font-semibold text-text-main">
                            <span>{billingCycle === 'yearly' ? 'Yearly' : billingCycle === 'quarterly' ? 'Quarterly' : 'Monthly'} Subscription</span>
                            <span>₦{subtotal.toLocaleString()}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between text-sm font-semibold text-text-secondary opacity-60">
                                <span>Tax</span>
                                <span>₦{tax.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-bold text-primary">
                            <span>Total Due</span>
                            <span>{plan?.isFree ? 'Free' : `₦${total.toLocaleString()}`}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-md mx-auto">
                <Button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full rounded-xl bg-primary px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                >
                    {plan?.isFree ? 'Activate Free Plan' : isTrialMode ? 'Pay ₦100 & Start Free Trial' : 'Pay Now & Activate Subscription'} <ArrowRight size={16} />
                </Button>
            </div>
        </motion.div>
    );
}

// --- Screen 7: Onboarding Complete & Business Summary ---
function CompleteStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: () => void }) {
    const plan = useSubscriptionStore((s) => s.getPlan(data.planId));
    const isTrial = data.isTrial || false;
    const activeSocialsCount = Object.values(data.socials || {}).filter(Boolean).length;

    return (
        <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 pb-20 max-w-2xl mx-auto"
        >
            {/* Top Celebration Card */}
            <div className="text-center space-y-4 pt-6">
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <div className="size-24 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20 relative z-10">
                        <CheckCircle2 size={48} strokeWidth={2.5} />
                    </div>
                </div>
                <div className="space-y-2">
                    <span className="inline-block px-4 py-1.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20">
                        Business Ready & Verified
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-display font-black text-text-main tracking-tight">
                        Welcome Aboard, {data.businessName || 'Partner'}! 🎉
                    </h1>
                    <p className="text-text-secondary text-sm font-medium leading-relaxed max-w-md mx-auto">
                        Your business profile, location, operating hours, and subscription have been configured.
                    </p>
                </div>
            </div>

            {/* Executive Business Summary Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden text-left">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-primary to-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 size-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-16 rounded-2xl bg-white p-1 shadow-lg shrink-0 overflow-hidden flex items-center justify-center">
                                {data.logo ? (
                                    <img src={data.logo} alt="Business Logo" className="size-full object-cover rounded-xl" />
                                ) : (
                                    <LogoIcon className="text-primary size-8" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black tracking-tight">{data.businessName || 'Business Name'}</h2>
                                    <Shield size={18} className="text-emerald-400 fill-emerald-400/20" />
                                </div>
                                <p className="text-xs text-white/80 font-medium mt-0.5 flex items-center gap-2">
                                    <Badge className="bg-white/20 text-white border-0 text-[9px] font-black uppercase tracking-widest">
                                        {data.category || 'Business'}
                                    </Badge>
                                    <span>•</span>
                                    <span>{data.address?.city || 'Nigeria'}</span>
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 shadow-md">
                            Active Account
                        </Badge>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="p-8 space-y-8">
                    {/* Grid Section 1: Subscription & Account Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Subscription Plan</span>
                                <Crown size={16} className="text-primary" />
                            </div>
                            <p className="text-lg font-black text-text-main capitalize">{plan?.name || data.planId || 'Standard'}</p>
                            <p className="text-xs font-semibold text-primary">
                                {isTrial ? '14-Day Free Trial Active' : 'Paid Subscription Active'}
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Billing Schedule</span>
                                <Clock size={16} className="text-text-secondary" />
                            </div>
                            <p className="text-lg font-black text-text-main capitalize">{data.billingCycle || 'Monthly'}</p>
                            <p className="text-xs font-semibold text-emerald-600">Auto-Debit Card Verified</p>
                        </div>
                    </div>

                    {/* Grid Section 2: Contact & Location */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Contact & Location Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                <Mail size={16} className="text-primary shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase text-gray-400">Official Email</p>
                                    <p className="font-bold text-text-main truncate">{data.contact?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                <MessageCircle size={16} className="text-green-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase text-gray-400">WhatsApp / Phone</p>
                                    <p className="font-bold text-text-main truncate">{data.contact?.whatsapp || data.contact?.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 sm:col-span-2">
                                <MapPin size={16} className="text-primary shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase text-gray-400">Physical Address</p>
                                    <p className="font-bold text-text-main truncate">
                                        {data.address?.street ? `${data.address.street}, ${data.address.city}, ${data.address.state}` : 'Default Address Set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Capabilities Badges */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Activated Platform Features</h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'My Business QR Code',
                                'Customer Capture Form',
                                'Automated Campaigns',
                                'Catalogue & POS System',
                                'Loyalty Rewards Engine',
                                'Real-time Analytics',
                                `${activeSocialsCount} Social Link${activeSocialsCount !== 1 ? 's' : ''}`
                            ].map((item, i) => (
                                <Badge key={i} variant="secondary" className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border border-primary/10 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    {item}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Next Steps / Actions */}
            <div className="space-y-3 max-w-md mx-auto pt-2">
                <Button 
                    onClick={onNext}
                    className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-7 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                    Go To My Dashboard <ArrowRight size={18} />
                </Button>
                <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard/customer-experience'}
                    className="w-full border-2 border-gray-200 text-text-main font-black uppercase tracking-widest text-[10px] py-7 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                    View & Download My Business QR Code
                </Button>
            </div>
        </motion.div>
    );
}

