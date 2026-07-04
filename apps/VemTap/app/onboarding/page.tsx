'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    CheckCircle2, 
    Smartphone,
    ArrowRight,
    Save,
    Search,
    Utensils,
    Scissors,
    ShoppingBag,
    Dumbbell,
    Hotel,
    Tv,
    ShoppingCart,
    Pill,
    Sparkles,
    Waves,
    Croissant,
    Coffee,
    Truck,
    Wrench,
    Home,
    GraduationCap,
    Briefcase,
    Stethoscope,
    MoreHorizontal,
    Camera,
    MapPin,
    Globe,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    MessageCircle,
    Phone,
    Mail,
    Clock,
    Calendar,
    Eye,
    EyeOff,
    Zap,
    Shield,
    Star,
    Crown,
    Play,
    Building2,
    Music,
    Coins,
    Sprout,
    Factory,
    Heart,
    Landmark,
    ChevronDown,
    ChevronRight,
    Trash2,
    Plus,
    X
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/services/categories/hooks';
import type { Category } from '@/services/categories/index';
import { useUpdateBusiness } from '@/services/businesses/hooks';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { PricingPlan } from '@/types/pricing';
import { useSubscribe } from '@/services/subscriptions/hooks';
import type { SubscribeRequest } from '@/services/subscriptions/types';
import { loadPaystackScript } from '@/lib/loadPaystackScript';
import { useAuthStore } from '@/store/useAuthStore';
import { useSystemSettingsStore } from '@/store/useSystemSettingsStore';
import LocationStep from './components/LocationStep';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

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
    latitude?: number;
    longitude?: number;
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
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [data, setData] = useState<Partial<OnboardingData>>({});

    const handleNext = (newData?: Partial<OnboardingData>) => {
        if (newData) setData(prev => ({ ...prev, ...newData }));
        
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
        
        // Skip payment if plan is free
        if (currentStep === '5A' && data.planId === 'free') {
            setCurrentStep(7);
            return;
        }

        const nextStep = nextStepMap[currentStep.toString()];
        if (nextStep) setCurrentStep(nextStep);
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
        if (backStep) setCurrentStep(backStep);
    };

    const progress = STEPS.find(s => s.id === currentStep)?.progress || 0;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-text-main">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 sm:py-4">
                <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
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
                            <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                                <Save size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Save & Exit</span>
                            </button>
                        )}
                    </div>
                    
                    {/* Progress Bar Section */}
                    {currentStep !== 7 && currentStep !== '2A' && currentStep !== '3A' && currentStep !== '5A' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50">
                                    Step {currentStep.toString()} of 7
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
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
                <div className="max-w-xl mx-auto px-6 pt-12">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && <WelcomeStep onNext={() => handleNext()} />}
                        {currentStep === 2 && <CategoryStep data={data} onNext={handleNext} />}
                        {currentStep === '2A' && <CategoryConfirmation onNext={() => handleNext()} />}
                        {currentStep === 3 && <DetailsStep data={data} onNext={handleNext} />}
                        {currentStep === '3A' && (
                            <LocationStep
                                address={data.address || { street: '', city: '', state: '', country: '', zip: '' }}
                                onNext={(locationData) => handleNext(locationData)}
                            />
                        )}
                        {currentStep === 4 && <OperatingStep data={data} onNext={handleNext} />}
                        {currentStep === 5 && <SubscriptionStep data={data} onNext={handleNext} />}
                        {currentStep === '5A' && <PlanConfirmation data={data} onNext={handleNext} onBack={handleBack} />}
                        {currentStep === 6 && <PaymentStep data={data} onNext={handleNext} />}
                        {currentStep === 7 && <CompleteStep data={data} onNext={() => router.push('/dashboard')} />}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// --- Screen 1: Welcome ---
function WelcomeStep({ onNext }: { onNext: () => void }) {
    const onboardingVideoUrl = useSystemSettingsStore((s) => s.onboardingVideoUrl);
    const checklist = [
        { label: 'Business Category', id: 2 },
        { label: 'Business Details', id: 3 },
        { label: 'Operating Information', id: 4 },
        { label: 'Subscription', id: 5 },
        { label: 'Payment', id: 6 },
        { label: 'Dashboard Access', id: 7 },
    ];

    return (
        <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="space-y-4">
                <h1 className="text-4xl font-display font-black text-text-main tracking-tight">
                    Welcome To Vemtap 👋
                </h1>
                <p className="text-text-secondary text-lg font-medium leading-relaxed">
                    Let's set up your business in a few quick steps.
                </p>
            </div>

            <div className="space-y-4 py-4">
                {[
                    'Complete your business profile',
                    'Manage your business presence',
                    'Choose a subscription plan',
                    'Get access to your dashboard',
                    'Start capturing customers'
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="size-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={14} />
                        </div>
                        <span className="font-bold text-sm text-text-main opacity-80">{item}</span>
                    </div>
                ))}
            </div>

            {onboardingVideoUrl && (
                <div className="rounded-[2rem] overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                    <div className="aspect-video bg-black">
                        <iframe
                            src={onboardingVideoUrl.replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {!onboardingVideoUrl && (
                <div className="bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                    <Play size={48} className="text-gray-300 mb-4" />
                    <p className="text-sm font-bold text-text-secondary">Onboarding Video</p>
                    <p className="text-xs text-text-secondary opacity-60 mt-1">Video will appear here once set by admin</p>
                </div>
            )}

            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-6">Setup Checklist</h3>
                <div className="space-y-4">
                    {checklist.map((item) => (
                        <div key={item.id} className="flex items-center justify-between opacity-40">
                            <span className="text-sm font-bold">{item.label}</span>
                            <div className="size-4 rounded-full border-2 border-gray-300" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto">
                    <Button 
                        onClick={onNext}
                        className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        Let's Get Started <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 2: Select Category ---
function CategoryStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: any) => void }) {
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

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const CATEGORY_ICONS: Record<string, React.ElementType> = {
        // Parent category matchers
        'retail': ShoppingBag,
        'food': Utensils,
        'beauty': Sparkles,
        'health': Stethoscope,
        'professional services': Briefcase,
        'technology': Tv,
        'education': GraduationCap,
        'real estate': Home,
        'automotive': Wrench,
        'logistics': Truck,
        'construction': Building2,
        'events': Music,
        'finance': Coins,
        'agriculture': Sprout,
        'manufacturing': Factory,
        'religious': Heart,
        'government': Landmark,
        'others': MoreHorizontal,
        // Subcategory matchers (more specific)
        'restaurant': Utensils,
        'salon & barbershop': Scissors,
        'gym & fitness': Dumbbell,
        'hotel & hospitality': Hotel,
        'electronics': Tv,
        'supermarket': ShoppingCart,
        'pharmacy': Pill,
        'beauty store': Sparkles,
        'spa': Waves,
        'bakery': Croissant,
        'cafe': Coffee,
        'laundry': Truck,
        'auto service': Wrench,
        'healthcare': Stethoscope,
    };

    const categories = rawCategories.map((cat: Category) => {
        const key = cat.name.toLowerCase();
        const icon = Object.entries(CATEGORY_ICONS).find(([k]) => key.includes(k))?.[1] || MoreHorizontal;
        return { id: cat.id, label: cat.name, description: cat.description, icon };
    });

    // If search matches exactly one category, auto-select it
    useEffect(() => {
        if (search && categories.length === 1) {
            setSelected(categories[0].id);
        }
    }, [search, categories]);

    return (
        <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="space-y-4">
                <h1 className="text-3xl font-display font-black text-text-main tracking-tight">
                    What Type Of Business Do You Run?
                </h1>
                <p className="text-text-secondary font-medium">
                    Select the category that best describes your business.
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Business Category"
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all"
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelected(cat.id)}
                        className={`group p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden ${
                            selected === cat.id 
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                                selected === cat.id ? 'bg-primary text-white' : 'bg-gray-50 text-text-secondary group-hover:bg-gray-100'
                            }`}>
                                <cat.icon size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className={`text-sm font-bold block ${selected === cat.id ? 'text-primary' : 'text-text-main'}`}>
                                    {cat.label}
                                </span>
                                <span className="text-[10px] text-text-secondary/60 font-medium mt-0.5 block line-clamp-1">
                                    {cat.description.replace(/^(Businesses that|Business Involves)\s+/i, '')}
                                </span>
                            </div>
                        </div>
                        {selected === cat.id && (
                            <motion.div 
                                layoutId="check"
                                className="absolute top-4 right-4 text-primary"
                            >
                                <CheckCircle2 size={18} />
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>
            )}

            {/* Pagination */}
            {!isLoading && meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400">
                        Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                                        className={`size-9 rounded-xl text-xs font-bold transition-all ${
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
                            className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto flex gap-4">
                    <Button 
                        disabled={!selected}
                        onClick={() => onNext({ category: selected })}
                        className="flex-1 bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
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
                <h1 className="text-4xl font-display font-black text-text-main tracking-tight">Perfect!</h1>
                <p className="text-text-secondary font-medium">We've customized Vemtap for your business type.</p>
            </div>
            <Button 
                onClick={onNext}
                variant="ghost" 
                className="text-primary font-black uppercase tracking-widest text-[10px]"
            >
                Continue <ArrowRight size={14} className="ml-2" />
            </Button>
        </motion.div>
    );
}

// --- Screen 3: Business Details ---
function DetailsStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: any) => void }) {
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

    useEffect(() => {
        const socialsMap: Record<string, string> = {};
        activeSocials.forEach(s => { socialsMap[s.id] = s.url; });
        setLocalData(prev => ({ ...prev, socials: socialsMap }));
    }, [activeSocials]);

    const handleContinue = async () => {
        if (!localData.businessName || !localData.address.street) return;
        setIsSaving(true);
        try {
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
                    facebookUrl: localData.socials.facebook || undefined,
                    instagramUrl: localData.socials.instagram || undefined,
                    tiktokUrl: localData.socials.tiktok || undefined,
                    xUrl: localData.socials.x || undefined,
                    linkedinUrl: localData.socials.linkedin || undefined,
                    whatsappNumber: localData.socials.whatsapp || undefined,
                }
            });

            // Sync user profile to update businessId and branchId in Zustand store
            try {
                const profile = await api.get('/users/profile');
                const token = useAuthStore.getState().access_token;
                if (token) {
                    useAuthStore.getState().login(profile, token);
                }
            } catch (err) {
                console.error('Failed to sync user profile after business creation:', err);
            }

            onNext(localData);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save business details');
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
            className="space-y-12 pb-20"
        >
            <div className="space-y-4">
                <h1 className="text-3xl font-display font-black text-text-main tracking-tight">
                    Tell Customers About Your Business
                </h1>
                <p className="text-text-secondary font-medium">
                    Create a complete business profile.
                </p>
            </div>

            {/* Business Logo Upload */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Business Logo</label>
                <div className="flex items-center gap-6">
                    <div className="size-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                        {localData.logo ? (
                            <img src={localData.logo} alt="Logo Preview" className="size-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-gray-400">
                                <Camera size={24} />
                                <span className="text-[10px] font-bold">Upload</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setLocalData({ ...localData, logo: reader.result as string });
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-text-main leading-tight">Recommended: Square PNG/JPG</p>
                        <p className="text-[10px] text-text-secondary font-medium">Max size: 2MB. We'll help you crop it.</p>
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-gray-50">Choose File</Button>
                            {localData.logo && (
                                <button onClick={() => setLocalData({...localData, logo: null})} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Remove</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Name */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Business Name</label>
                <input 
                    type="text"
                    value={localData.businessName}
                    onChange={(e) => setLocalData({ ...localData, businessName: e.target.value })}
                    placeholder="e.g. The Coffee House"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-lg"
                />
            </div>

            {/* Address Section */}
            <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Business Address</label>
                <div className="space-y-4">
                    <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Street Address"
                            value={localData.address.street}
                            onChange={(e) => setLocalData({ ...localData, address: { ...localData.address, street: e.target.value } })}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="text" placeholder="City"
                            value={localData.address.city}
                            onChange={(e) => setLocalData({ ...localData, address: { ...localData.address, city: e.target.value } })}
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm"
                        />
                        <input 
                            type="text" placeholder="State"
                            value={localData.address.state}
                            onChange={(e) => setLocalData({ ...localData, address: { ...localData.address, state: e.target.value } })}
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Business Description */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Business Description</label>
                    <span className="text-[10px] font-black text-text-secondary opacity-40">{localData.description.length}/300</span>
                </div>
                <textarea 
                    maxLength={300}
                    value={localData.description}
                    onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
                    placeholder="Tell your customers what makes your business special..."
                    rows={4}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm resize-none"
                />
            </div>

            {/* Website */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Website (Optional)</label>
                <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="url"
                        value={localData.website}
                        onChange={(e) => setLocalData({ ...localData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm"
                    />
                </div>
            </div>

            {/* Social Media Section */}
            <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Social Media</label>
                <div className="space-y-6">
                    <div className="relative">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <button
                                    type="button"
                                    onClick={() => setIsSocialDropdownOpen(!isSocialDropdownOpen)}
                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 flex items-center justify-between text-sm font-bold text-text-main hover:bg-gray-100 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        {selectedSocial ? (
                                            <>
                                                <div className={`p-1.5 rounded-lg bg-white shadow-sm ${selectedSocial.color}`}>
                                                    <selectedSocial.icon size={16} />
                                                </div>
                                                <span>{selectedSocial.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-1.5 rounded-lg bg-white shadow-sm text-gray-400">
                                                    <Plus size={16} />
                                                </div>
                                                <span className="text-gray-400">Select Platform</span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSocialDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isSocialDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[9999] overflow-hidden py-2"
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
                                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:grayscale"
                                                >
                                                    <div className={`p-2 rounded-xl ${platform.bg} ${platform.color}`}>
                                                        <platform.icon size={18} />
                                                    </div>
                                                    <div className="flex-1 text-left text-sm font-bold text-text-main">
                                                        {platform.name}
                                                        {isAlreadyAdded && platform.id !== 'custom' && (
                                                            <span className="ml-2 text-[9px] uppercase tracking-widest text-green-500 font-black">Added</span>
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
                                className="mt-4 space-y-3 overflow-hidden"
                            >
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={socialHandle}
                                            onChange={(e) => setSocialHandle(e.target.value)}
                                            placeholder={selectedSocial.placeholder}
                                            className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-text-main focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            autoFocus
                                        />
                                        {selectedSocial.prefix && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                                                Handle Only
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddSocial}
                                        disabled={!socialHandle.trim()}
                                        className="h-12 px-6 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedSocial(null); setSocialHandle(''); }}
                                        className="h-12 w-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                {selectedSocial.prefix && (
                                    <p className="text-[10px] text-gray-400 ml-1">
                                        Your profile link will be: <span className="text-primary font-bold">{selectedSocial.prefix}{socialHandle || 'handle'}</span>
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </div>
                    {activeSocials.length > 0 && (
                        <div className="space-y-2 mt-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Active Links</label>
                            <div className="grid grid-cols-1 gap-2">
                                {activeSocials.map((social) => (
                                    <motion.div
                                        layout
                                        key={social.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`p-2 rounded-xl ${social.bg} ${social.color} shrink-0`}>
                                                <social.icon size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-text-main uppercase tracking-tighter leading-none">{social.name}</p>
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
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Profile Preview Card */}
            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-center">Live Profile Preview</h3>
                <div className="max-w-[320px] mx-auto w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="h-24 bg-primary/10 flex items-center justify-center">
                        <div className="size-16 bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
                            {localData.logo ? <img src={localData.logo} className="size-full object-cover" /> : <LogoIcon className="text-primary size-8" />}
                        </div>
                    </div>
                    <div className="p-6 text-center space-y-4">
                        <div className="space-y-1">
                            <h4 className="font-black text-lg text-text-main line-clamp-1">{localData.businessName || 'Business Name'}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 inline-block px-3 py-1 rounded-full">
                                {data.category || 'Category'}
                            </p>
                        </div>
                        <p className="text-xs text-text-secondary font-medium line-clamp-2">
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
                                <div className="text-[10px] text-text-secondary opacity-30 font-bold uppercase tracking-widest py-2">Socials appear here</div>
                            )}
                        </div>
                        <Button className="w-full bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl py-6">Connect With Us</Button>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto flex gap-4">
                    <Button 
                        disabled={!localData.businessName || !localData.address.street || isSaving}
                        onClick={handleContinue}
                        className="flex-1 bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {isSaving ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 4: Business Operating Details ---
function OperatingStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: any) => void }) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentUser = useAuthStore((state) => state.user);
    
    const [localData, setLocalData] = useState({
        contact: data.contact || { phone: '', secondaryPhone: '', email: '', supportEmail: '', whatsapp: '' },
        hours: data.hours || days.reduce((acc, day) => ({ 
            ...acc, 
            [day]: { open: '09:00', close: '18:00', isClosed: false, is24h: false } 
        }), {}),
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        isVisible: data.isVisible ?? true
    });
    const [isSaving, setIsSaving] = useState(false);
    const updateBusiness = useUpdateBusiness();
    const [useSignupEmail, setUseSignupEmail] = useState(true);
    const [useSignupPhone, setUseSignupPhone] = useState(true);

    // Sync contact fields when toggles change
    useEffect(() => {
        if (useSignupEmail && currentUser?.email) {
            setLocalData(prev => ({ ...prev, contact: { ...prev.contact, email: currentUser.email } }));
        } else if (!useSignupEmail && localData.contact.email === currentUser?.email) {
            setLocalData(prev => ({ ...prev, contact: { ...prev.contact, email: '' } }));
        }
    }, [useSignupEmail]);

    useEffect(() => {
        if (useSignupPhone && currentUser?.phone) {
            setLocalData(prev => ({ ...prev, contact: { ...prev.contact, whatsapp: currentUser.phone } }));
        } else if (!useSignupPhone && localData.contact.whatsapp === currentUser?.phone) {
            setLocalData(prev => ({ ...prev, contact: { ...prev.contact, whatsapp: '' } }));
        }
    }, [useSignupPhone]);

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
                        [day.toLowerCase()]: { open: (h as any).open, close: (h as any).close, closed: (h as any).isClosed }
                    }), {} as Record<string, { open: string; close: string; closed: boolean }>),
                    timezone: localData.timezone,
                    isVisible: localData.isVisible,
                }
            });
            onNext(localData);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save operating details');
        } finally {
            setIsSaving(false);
        }
    };

    const updateDay = (day: string, updates: any) => {
        setLocalData({
            ...localData,
            hours: {
                ...localData.hours,
                [day]: { ...(localData.hours as any)[day], ...updates }
            }
        });
    };

    const applyToAll = () => {
        const mon = (localData.hours as any)['Monday'];
        const newHours = days.reduce((acc, day) => ({ ...acc, [day]: { ...mon } }), {});
        setLocalData({ ...localData, hours: newHours });
    };

    return (
        <motion.div
            key="operating"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12 pb-20"
        >
            <div className="space-y-4">
                <h1 className="text-3xl font-display font-black text-text-main tracking-tight">
                    Business Operating Information
                </h1>
                <p className="text-text-secondary font-medium">
                    How and when can customers reach you?
                </p>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Contact Information</label>
                <div className="space-y-4">
                    {/* Business Email */}
                    <div className="space-y-2">
                        <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="email"
                                placeholder="Business Email"
                                value={localData.contact.email}
                                onChange={(e) => setLocalData({ ...localData, contact: { ...localData.contact, email: e.target.value } })}
                                disabled={useSignupEmail}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-1">
                            <button
                                type="button"
                                onClick={() => setUseSignupEmail(!useSignupEmail)}
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
                            <MessageCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="tel"
                                placeholder="WhatsApp Business Number"
                                value={localData.contact.whatsapp}
                                onChange={(e) => setLocalData({ ...localData, contact: { ...localData.contact, whatsapp: e.target.value } })}
                                disabled={useSignupPhone}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-1">
                            <button
                                type="button"
                                onClick={() => setUseSignupPhone(!useSignupPhone)}
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
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Opening Hours</label>
                    <button onClick={applyToAll} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Apply Monday To All</button>
                </div>

                <div className="space-y-4">
                    {days.map((day) => {
                        const h = (localData.hours as any)[day];
                        return (
                            <div key={day} className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm">{day}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50">24h</span>
                                            <Switch 
                                                checked={h.is24h}
                                                onCheckedChange={(val) => updateDay(day, { is24h: val, isClosed: false })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50">Closed</span>
                                            <Switch 
                                                checked={h.isClosed}
                                                onCheckedChange={(val) => updateDay(day, { isClosed: val, is24h: false })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {!h.isClosed && !h.is24h && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-4 pt-2"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-1 opacity-50">Open</label>
                                            <input 
                                                type="time" value={h.open}
                                                onChange={(e) => updateDay(day, { open: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-xs"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-1 opacity-50">Close</label>
                                            <input 
                                                type="time" value={h.close}
                                                onChange={(e) => updateDay(day, { close: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-xs"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Timezone Selector */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Timezone</label>
                <div className="relative">
                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                        value={localData.timezone}
                        onChange={(e) => setLocalData({ ...localData, timezone: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm appearance-none"
                    >
                        <option value={localData.timezone}>{localData.timezone} (Auto-detected)</option>
                        {/* More timezones could be added here */}
                    </select>
                </div>
            </div>

            {/* Visibility Toggle */}
            <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-black text-sm text-text-main flex items-center gap-2">
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

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto">
                    <Button 
                        disabled={!localData.contact.email || isSaving}
                        onClick={handleContinue}
                        className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {isSaving ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 5: Subscription Selection ---
function SubscriptionStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: any) => void }) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [selectedPlan, setSelectedPlan] = useState(data.planId || '');
    const plans = useSubscriptionStore((s) => s.plans);
    const pricingLoading = useSubscriptionStore((s) => s.isLoading);

    const formatPrice = (plan: PricingPlan) => {
        if (plan.isFree) return '₦0';
        let price: number;
        if (billingCycle === 'yearly') price = plan.yearlyPrice || plan.monthlyPrice * 12;
        else if (billingCycle === 'quarterly') price = plan.quarterlyPrice || plan.monthlyPrice * 3;
        else price = plan.monthlyPrice;
        return `₦${price.toLocaleString()}`;
    };

    const getBillingTotal = (plan: PricingPlan) => {
        if (plan.isFree) return '';
        if (billingCycle === 'yearly') return `₦${(plan.yearlyPrice || plan.monthlyPrice * 12).toLocaleString()} billed annually`;
        if (billingCycle === 'quarterly') return `₦${(plan.quarterlyPrice || plan.monthlyPrice * 3).toLocaleString()} billed quarterly`;
        return '';
    };

    const getBillingPeriodLabel = (plan: PricingPlan) => {
        if (plan.isFree) return '';
        return billingCycle === 'yearly' ? '/yr' : billingCycle === 'quarterly' ? '/qtr' : '/mo';
    };

    const renderHighlightedCard = (plan: PricingPlan, idx: number) => {
        const isSelected = selectedPlan === plan.id;
        const isHighlighted = plan.isPopular;

        return (
            <motion.button
                key={plan.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative flex flex-col text-left rounded-3xl border-2 transition-all duration-200 overflow-hidden h-full ${
                    isSelected
                        ? 'border-primary ring-4 ring-primary/10 shadow-xl shadow-primary/10'
                        : isHighlighted
                            ? 'border-primary/30 shadow-lg hover:shadow-xl'
                            : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                } ${isSelected ? (isHighlighted ? 'bg-primary' : 'bg-primary/5') : isHighlighted ? 'bg-white' : 'bg-white'}`}
            >
                {/* Most Popular Badge */}
                {isHighlighted && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="px-4 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary/30">
                            Most Popular
                        </div>
                    </div>
                )}

                <div className="p-6 sm:p-7 flex flex-col flex-1">
                    {/* Plan Name & Description */}
                    <div className="space-y-2 mb-4">
                        <h3 className={`text-base sm:text-lg font-black leading-snug ${isSelected && isHighlighted ? 'text-white' : 'text-text-main'}`}>
                            {plan.name}
                        </h3>
                        {plan.description && (
                            <p className={`text-xs font-medium leading-relaxed ${isSelected && isHighlighted ? 'text-white/80' : 'text-text-secondary'}`}>
                                {plan.description}
                            </p>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="space-y-1 mb-4">
                        <div className={`flex items-baseline gap-1 ${isSelected && isHighlighted ? 'text-white' : 'text-text-main'}`}>
                            <span className="text-2xl sm:text-3xl font-black tracking-tight">{formatPrice(plan)}</span>
                            <span className={`text-xs sm:text-sm font-bold ${isSelected && isHighlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                                {getBillingPeriodLabel(plan)}
                            </span>
                        </div>
                        {getBillingTotal(plan) && (
                            <p className={`text-[11px] font-medium ${isSelected && isHighlighted ? 'text-white/60' : 'text-text-secondary/60'}`}>
                                {getBillingTotal(plan)}
                            </p>
                        )}
                    </div>

                    {/* Free Trial Badge */}
                    {plan.trialDurationDays > 0 && !plan.isFree && (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${
                            isSelected && isHighlighted ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700'
                        }`}>
                            <Zap size={12} />
                            {plan.trialDurationDays}-Day Free Trial
                        </div>
                    )}

                    {/* Divider */}
                    <div className={`border-t mb-4 ${isSelected && isHighlighted ? 'border-white/20' : 'border-gray-100'}`} />

                    {/* Features */}
                    <div className="space-y-3 flex-1">
                        <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSelected && isHighlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                            What's Included
                        </p>
                        <div className="space-y-2.5">
                            {plan.features.map((feature: string, i: number) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <CheckCircle2 
                                        size={14} 
                                        className={`shrink-0 mt-0.5 ${isSelected && isHighlighted ? 'text-white' : 'text-green-500'}`} 
                                    />
                                    <span className={`text-xs font-medium leading-snug ${isSelected && isHighlighted ? 'text-white/90' : 'text-text-main'}`}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Usage Limits */}
                    <div className={`mt-4 pt-3 space-y-2 ${isSelected && isHighlighted ? 'border-t border-white/20' : 'border-t border-gray-100'}`}>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {plan.messagingEnabled && (
                                <div className={`text-[11px] font-medium ${isSelected && isHighlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                                    SMS: {plan.smsCredits === -1 ? 'Unlimited' : `${plan.smsCredits}/mo`}
                                </div>
                            )}
                            {plan.teamMembersEnabled && (
                                <div className={`text-[11px] font-medium ${isSelected && isHighlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                                    Team: {plan.teamMembersLimit === -1 ? 'Unlimited' : `${plan.teamMembersLimit} members`}
                                </div>
                            )}
                            {plan.branchesEnabled && (
                                <div className={`text-[11px] font-medium ${isSelected && isHighlighted ? 'text-white/70' : 'text-text-secondary'}`}>
                                    Branches: {plan.branchLimit === -1 ? 'Unlimited' : `${plan.branchLimit}`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                    <div className={`px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                        isHighlighted ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                        <CheckCircle2 size={14} />
                        Selected
                    </div>
                )}
            </motion.button>
        );
    };

    const renderRegularCard = (plan: PricingPlan, idx: number) => {
        return renderHighlightedCard(plan, idx);
    };

    return (
        <motion.div
            key="subscription"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10 pb-20"
        >
            <div className="text-center space-y-3">
                <span className="inline-block px-3 py-1 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                    Transparent Pricing
                </span>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-text-main tracking-tight">
                    Choose Your Plan
                </h1>
                <p className="text-text-secondary font-medium max-w-md mx-auto">
                    Select the plan that best fits your business growth needs. Upgrade or cancel anytime.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100/80 p-1.5 rounded-2xl flex items-center gap-1 relative">
                    {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setBillingCycle(cycle)}
                            className={`relative px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                billingCycle === cycle
                                    ? 'bg-white shadow-lg shadow-black/5 text-primary scale-[1.02]'
                                    : 'text-text-secondary hover:text-text-main'
                            }`}
                        >
                            {cycle}
                            {cycle === 'yearly' && (
                                <span className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 bg-green-500 text-white text-[7px] font-black uppercase tracking-widest rounded-full">
                                    -20%
                                </span>
                            )}
                            {cycle === 'quarterly' && (
                                <span className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 bg-green-500 text-white text-[7px] font-black uppercase tracking-widest rounded-full">
                                    -10%
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {pricingLoading || plans.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto items-stretch">
                    {plans.map((plan: PricingPlan, idx: number) => (
                        plan.isPopular ? renderHighlightedCard(plan, idx) : renderRegularCard(plan, idx)
                    ))}
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 md:relative md:p-0 md:bg-transparent md:border-0 mt-4">
                <div className="max-w-xl mx-auto">
                    <Button 
                        disabled={!selectedPlan}
                        onClick={() => onNext({ planId: selectedPlan, billingCycle })}
                        className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-7 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {plans.find(p => p.id === selectedPlan)?.isFree ? 'Continue' : 'Continue to Payment'} <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 5A: Plan Confirmation ---
function PlanConfirmation({ data, onNext, onBack }: { data: Partial<OnboardingData>, onNext: (d: any) => void, onBack: () => void }) {
    const plan = useSubscriptionStore((s) => s.getPlan(data.planId));
    const planFeatures = plan?.features || [];

    return (
        <motion.div
            key="plan-confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-12 text-center py-12"
        >
            <div className="space-y-4">
                <h1 className="text-4xl font-display font-black text-text-main tracking-tight uppercase">You Selected {plan?.name || data.planId} Plan</h1>
                <p className="text-text-secondary font-medium">Great choice! Let's get your subscription active.</p>
            </div>

            <div className="max-w-sm mx-auto bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 space-y-6">
                    <div className="size-20 bg-primary text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg">
                        <Star size={40} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-2xl text-text-main capitalize">{plan?.name || data.planId} Plan</h3>
                        <p className="text-xs text-text-secondary font-medium">Billed {plan?.isFree ? 'Once' : 'Automatically'}</p>
                    </div>
                    <div className="pt-6 border-t border-gray-200 space-y-3">
                        {planFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-bold text-text-main">
                                <CheckCircle2 size={16} className="text-green-500" />
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-8">
                <Button 
                    onClick={() => onNext({})}
                    className="w-full max-w-sm mx-auto bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                >
                    {plan?.isFree ? 'Complete Setup' : 'Continue To Payment'} <ArrowRight size={18} />
                </Button>
                <button 
                    onClick={onBack}
                    className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors"
                >
                    Change Plan
                </button>
            </div>
        </motion.div>
    );
}

// --- Screen 6: Payment Screen ---
function PaymentStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: (d: any) => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { user } = useAuthStore();
    const plan = useSubscriptionStore((s) => s.getPlan(data.planId));
    const subscribe = useSubscribe();

    const billingCycle = data.billingCycle || 'monthly';
    const subtotal = plan?.isFree ? 0 : billingCycle === 'yearly'
        ? (plan?.yearlyPrice || (plan?.monthlyPrice || 0) * 12)
        : billingCycle === 'quarterly'
            ? (plan?.quarterlyPrice || (plan?.monthlyPrice || 0) * 3)
            : (plan?.monthlyPrice || 0);
    const tax = Math.round(subtotal * 0.075);
    const total = subtotal + tax;

    const handlePay = async () => {
        if (plan?.isFree) {
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
            } catch (err: any) {
                toast.error(err?.message || 'Failed to activate plan');
                setIsProcessing(false);
            }
            return;
        }

        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
        if (!publicKey || publicKey.includes('placeholder')) {
            setIsProcessing(true);
            try {
                await subscribe.mutateAsync({
                    planId: plan!.id,
                    billingPeriod: billingCycle,
                    businessId: user?.businessId,
                    paymentReference: `mock-ref-${Date.now()}`,
                });
                setIsProcessing(false);
                setIsSuccess(true);
                setTimeout(() => onNext({}), 2000);
            } catch (err: any) {
                toast.error(err?.message || 'Failed to activate subscription');
                setIsProcessing(false);
            }
            return;
        }

        setIsProcessing(true);
        try {
            await loadPaystackScript();
            const email = user?.email || '';
            const paystackRef = `SUB-${user?.businessId || 'anon'}-${Date.now()}`;
            // @ts-ignore
            const handler = window.PaystackPop.setup({
                key: publicKey,
                email,
                amount: total * 100,
                currency: 'NGN',
                ref: paystackRef,
                onClose: function () {
                    setIsProcessing(false);
                },
                callback: function (response: any) {
                    subscribe.mutateAsync({
                        planId: plan!.id,
                        billingPeriod: billingCycle,
                        businessId: user?.businessId,
                        paymentReference: response.reference,
                    }).then(() => {
                        setIsProcessing(false);
                        setIsSuccess(true);
                        setTimeout(() => onNext({}), 2000);
                    }).catch((err: any) => {
                        toast.error(err?.message || 'Payment verified but subscription sync failed');
                        setIsProcessing(false);
                    });
                },
            });
            handler.openIframe();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to initialize payment');
            setIsProcessing(false);
        }
    };

    if (isProcessing) {
        return (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="size-24 border-8 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="space-y-2">
                    <h1 className="text-3xl font-display font-black text-text-main tracking-tight">Processing Payment</h1>
                    <p className="text-text-secondary font-medium">Please do not close this page.</p>
                </div>
            </motion.div>
        );
    }

    if (isSuccess) {
        return (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="size-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                    <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-display font-black text-text-main tracking-tight">Payment Successful 🎉</h1>
                    <p className="text-text-secondary font-medium">Your subscription has been activated.</p>
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
            className="space-y-12 pb-20"
        >
            <div className="space-y-4 text-center">
                <h1 className="text-3xl font-display font-black text-text-main tracking-tight">Complete Your Subscription</h1>
                <p className="text-text-secondary font-medium">Safe and secure payment gateway.</p>
            </div>

            {/* Order Summary Card */}
            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Order Summary</span>
                    <Badge variant="outline" className="border-primary/20 text-primary capitalize">{plan?.name || data.planId}</Badge>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold text-text-main">
                        <span>{billingCycle === 'yearly' ? 'Yearly' : billingCycle === 'quarterly' ? 'Quarterly' : 'Monthly'} Subscription</span>
                        <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-text-secondary opacity-50">
                        <span>Tax (7.5%)</span>
                        <span>₦{tax.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex justify-between text-xl font-black text-primary">
                        <span>Total</span>
                        <span>{plan?.isFree ? 'Free' : `₦${total.toLocaleString()}`}</span>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto">
                    <Button 
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {plan?.isFree ? 'Activate Free Plan' : 'Pay Now'} <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Screen 7: Onboarding Complete ---
function CompleteStep({ data, onNext }: { data: Partial<OnboardingData>, onNext: () => void }) {
    return (
        <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 text-center pb-20"
        >
            <div className="relative flex justify-center py-12">
                <div className="relative size-64 flex items-center justify-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="absolute inset-0 bg-primary rounded-full blur-[80px] opacity-20" />
                    <div className="relative z-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
                        <div className="size-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className="text-3xl font-display font-black text-text-main tracking-tight">Your Business Is Ready</h1>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-text-secondary text-lg font-medium leading-relaxed max-w-sm mx-auto">
                    Your Vemtap account has been successfully configured.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    {['My Business QR', 'Capture Customers', 'Build Database', 'Marketing Campaigns', 'Track Growth'].map((item, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100 text-text-main text-[10px] font-black uppercase tracking-widest px-4 py-2 border-0">
                            ✓ {item}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="max-w-sm mx-auto bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 text-left space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Business Summary</h3>
                <div className="space-y-2 text-sm font-bold text-text-main">
                    <div className="flex justify-between"><span>NAME</span><span className="text-primary">{data.businessName}</span></div>
                    <div className="flex justify-between uppercase"><span>PLAN</span><span className="text-primary">{data.planId}</span></div>
                    <div className="flex justify-between uppercase"><span>STATUS</span><span className="text-green-600">Active</span></div>
                </div>
            </div>

            <div className="space-y-4 pt-8 max-w-sm mx-auto">
                <Button 
                    onClick={onNext}
                    className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                >
                    Go To Dashboard <ArrowRight size={18} />
                </Button>
                <Button 
                    variant="outline"
                    className="w-full border-2 border-gray-100 text-text-secondary font-black uppercase tracking-widest text-[10px] py-8 rounded-2xl hover:bg-gray-50 transition-all"
                >
                    Manage My Business QR
                </Button>
            </div>
        </motion.div>
    );
}
