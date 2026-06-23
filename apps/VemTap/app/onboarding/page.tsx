'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    CheckCircle2, 
    QrCode, 
    Users, 
    BarChart3, 
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
    Crown
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
import LocationStep from './components/LocationStep';
import toast from 'react-hot-toast';

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
                <div className="max-w-xl mx-auto space-y-2 sm:space-y-4">
                    {/* Top Row: Logo and Save & Exit */}
                    <div className="flex items-center justify-between">
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
            <div className="relative flex justify-center py-12">
                <div className="relative size-48">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 bg-primary/5 rounded-[3rem] rotate-6" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="size-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary">
                                <QrCode size={32} />
                            </div>
                            <div className="size-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary">
                                <Users size={32} />
                            </div>
                            <div className="size-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary">
                                <BarChart3 size={32} />
                            </div>
                            <div className="size-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary">
                                <Smartphone size={32} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
    const { data: categoriesData, isLoading } = useCategories();
    const rawCategories: Category[] = categoriesData?.items || [];

    const CATEGORY_ICONS: Record<string, React.ElementType> = {
        'restaurant': Utensils,
        'salon & barbershop': Scissors,
        'retail & fashion': ShoppingBag,
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
        'real estate': Home,
        'education': GraduationCap,
        'professional services': Briefcase,
        'healthcare': Stethoscope,
    };

    const categories = rawCategories.map((cat: Category) => {
        const key = cat.name.toLowerCase();
        const icon = Object.entries(CATEGORY_ICONS).find(([k]) => key.includes(k))?.[1] || MoreHorizontal;
        return { id: cat.id, label: cat.name, icon };
    });

    const filtered = categories.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));

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
            <div className="grid grid-cols-2 gap-4">
                {filtered.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelected(cat.id)}
                        className={`group p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden ${
                            selected === cat.id 
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                    >
                        <div className={`size-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                            selected === cat.id ? 'bg-primary text-white' : 'bg-gray-50 text-text-secondary group-hover:bg-gray-100'
                        }`}>
                            <cat.icon size={24} />
                        </div>
                        <span className={`text-sm font-bold block ${selected === cat.id ? 'text-primary' : 'text-text-main'}`}>
                            {cat.label}
                        </span>
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
        socials: data.socials || { facebook: '', instagram: '', tiktok: '', x: '', linkedin: '', whatsapp: '' }
    });
    const [isSaving, setIsSaving] = useState(false);
    const updateBusiness = useUpdateBusiness();

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
                <div className="space-y-4">
                    {[
                        { id: 'facebook', icon: Facebook, label: 'Facebook' },
                        { id: 'instagram', icon: Instagram, label: 'Instagram' },
                        { id: 'tiktok', icon: Smartphone, label: 'TikTok' },
                        { id: 'x', icon: Twitter, label: 'X (Twitter)' },
                        { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                        { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp Business' },
                    ].map((platform) => (
                        <div key={platform.id} className="relative">
                            <platform.icon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={(localData.socials as any)[platform.id]}
                                onChange={(e) => setLocalData({ ...localData, socials: { ...localData.socials, [platform.id]: e.target.value } })}
                                placeholder={`${platform.label} Username/URL`}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-xs"
                            />
                        </div>
                    ))}
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
                            {Object.values(localData.socials).some(Boolean) ? (
                                Object.entries(localData.socials).map(([id, val]) => val && (
                                    <div key={id} className="size-8 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary">
                                        <Smartphone size={14} />
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

    const handleContinue = async () => {
        if (!localData.contact.phone || !localData.contact.email) return;
        setIsSaving(true);
        try {
            await updateBusiness.mutateAsync({
                updates: {
                    phone: localData.contact.phone,
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
                    <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="tel"
                            placeholder="Primary Phone Number"
                            value={localData.contact.phone}
                            onChange={(e) => setLocalData({ ...localData, contact: { ...localData.contact, phone: e.target.value } })}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm"
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="email"
                            placeholder="Business Email"
                            value={localData.contact.email}
                            onChange={(e) => setLocalData({ ...localData, contact: { ...localData.contact, email: e.target.value } })}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm"
                        />
                    </div>
                    <div className="relative">
                        <MessageCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="tel"
                            placeholder="WhatsApp Business Number"
                            value={localData.contact.whatsapp}
                            onChange={(e) => setLocalData({ ...localData, contact: { ...localData.contact, whatsapp: e.target.value } })}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm"
                        />
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
                        disabled={!localData.contact.phone || !localData.contact.email || isSaving}
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

    const getPlanMeta = (plan: PricingPlan) => {
        const name = plan.name.toLowerCase();
        if (plan.isFree || name.includes('starter') || name.includes('free')) {
            return { icon: Zap, color: 'bg-gray-50 text-text-secondary', badge: 'Free', badgeColor: 'border-gray-300 text-gray-500' };
        }
        if (plan.isPopular || name.includes('professional') || name.includes('silver')) {
            return { icon: Shield, color: 'bg-blue-50 text-primary', badge: 'Popular', badgeColor: 'border-primary/20 text-primary' };
        }
        if (name.includes('ultimate') || name.includes('gold') || name.includes('premium')) {
            return { icon: Star, color: 'bg-yellow-50 text-yellow-600', badge: 'Best Value', badgeColor: 'border-yellow-300 text-yellow-700' };
        }
        return { icon: Crown, color: 'bg-purple-50 text-purple-600', badge: 'Premium', badgeColor: 'border-purple-300 text-purple-700' };
    };

    const formatPrice = (plan: PricingPlan) => {
        if (plan.isFree) return '₦0';
        let price: number;
        if (billingCycle === 'yearly') price = plan.yearlyPrice || plan.monthlyPrice * 12;
        else if (billingCycle === 'quarterly') price = plan.quarterlyPrice || plan.monthlyPrice * 3;
        else price = plan.monthlyPrice;
        return `₦${price.toLocaleString()}`;
    };

    const uiPlans = plans.map((plan: PricingPlan) => {
        const meta = getPlanMeta(plan);
        return {
            id: plan.id,
            name: plan.name,
            price: formatPrice(plan),
            badge: meta.badge,
            icon: meta.icon,
            color: meta.color,
            badgeColor: meta.badgeColor,
            features: plan.features,
        };
    });

    return (
        <motion.div
            key="subscription"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12 pb-20"
        >
            <div className="space-y-4">
                <h1 className="text-3xl font-display font-black text-text-main tracking-tight">
                    Choose Your Plan
                </h1>
                <p className="text-text-secondary font-medium">
                    Select the plan that best fits your business growth needs.
                </p>
            </div>

            {/* Pricing Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1 relative">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary opacity-50'}`}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBillingCycle('quarterly')}
                        className={`px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${billingCycle === 'quarterly' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary opacity-50'}`}
                    >
                        Quarterly
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary opacity-50'}`}
                    >
                        Yearly
                    </button>
                    <Badge className="absolute -top-3 -right-6 bg-green-500 text-[8px] font-black uppercase tracking-widest border-0">Save 20%</Badge>
                </div>
            </div>

            {pricingLoading || plans.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : uiPlans.length === 0 ? (
                <div className="text-center py-20 text-text-secondary font-medium">No plans available</div>
            ) : (
            <div className="space-y-4">
                {uiPlans.map((plan) => (
                    <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all group relative overflow-hidden ${
                            selectedPlan === plan.id 
                            ? 'border-primary bg-primary/5 shadow-lg' 
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                            <div className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center shrink-0 ${plan.color}`}>
                                <plan.icon size={24} className="sm:size-[28px]" />
                            </div>
                            <div className="flex-1 w-full space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-black text-base sm:text-lg text-text-main leading-tight">{plan.name}</h3>
                                    <span className="text-primary font-black text-base sm:text-lg whitespace-nowrap">{plan.price}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest shrink-0 ${plan.badgeColor}`}>
                                        {plan.badge}
                                    </Badge>
                                    <p className="text-[10px] text-text-secondary font-medium opacity-50 line-clamp-1 sm:line-clamp-none">
                                        {plan.features.join(' • ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50 md:relative md:p-0 md:bg-transparent md:border-0">
                <div className="max-w-xl mx-auto">
                    <Button 
                        disabled={!selectedPlan}
                        onClick={() => onNext({ planId: selectedPlan, billingCycle })}
                        className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        Continue
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
