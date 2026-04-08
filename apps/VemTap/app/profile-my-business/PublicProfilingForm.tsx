'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building2, MapPin, ClipboardList, TrendingUp, CheckCircle2,
    ChevronRight, ChevronLeft, Zap, HelpCircle, User, Sparkles,
    Trophy, Star, Rocket, Target, Crown, PartyPopper, Heart,
    ShieldCheck, ArrowRight, Gift, Mail, Phone
} from 'lucide-react';
import { businessProfilingApi } from '@/lib/api/business-profiling';
import { notify } from '@/lib/notify';
import confetti from 'canvas-confetti';

const BUSINESS_CATEGORIES = [
    'Retail & Shops', 'Food & Hospitality', 'Beauty & Personal Care', 'Health & Medical',
    'Professional Services', 'Education & Training', 'Technology & Digital Service',
    'Real Estate & Property', 'Automotive', 'Logistics & Transportation',
    'Construction & Home Service', 'Event & Entertainment', 'Agriculture & Farming',
    'Finance & Financial Services', 'Government & Public Service', 'Religion & NGO', 'Other'
];

const STEP_META = [
    { id: 1, title: 'Your Identity', subtitle: "Let's meet your business!", icon: Building2, emoji: '👋', color: 'from-violet-500 to-purple-600' },
    { id: 2, title: 'Contact Info', subtitle: 'How do we reach you?', icon: User, emoji: '📱', color: 'from-blue-500 to-cyan-600' },
    { id: 3, title: 'Industry Detail', subtitle: 'What makes you unique?', icon: Sparkles, emoji: '✨', color: 'from-pink-500 to-rose-600' },
    { id: 4, title: 'Deep Dive', subtitle: 'Specifics for your niche!', icon: Target, emoji: '🎯', color: 'from-indigo-500 to-blue-600' },
    { id: 5, title: 'Your Scale', subtitle: 'How big is the operation?', icon: TrendingUp, emoji: '📊', color: 'from-blue-500 to-cyan-600' },
    { id: 6, title: 'Operational Flow', subtitle: 'How do you run things?', icon: Rocket, emoji: '🌊', color: 'from-emerald-500 to-green-600' },
    { id: 7, title: 'Digital readiness', subtitle: 'Current tech setup', icon: Zap, emoji: '⚡', color: 'from-amber-500 to-orange-600' },
    { id: 8, title: 'Final Review', subtitle: 'Almost there!', icon: Crown, emoji: '🏆', color: 'from-yellow-500 to-amber-600' },
];

const STEP_XP = [10, 10, 15, 25, 10, 15, 15, 20];
const TOTAL_XP = STEP_XP.reduce((a, b) => a + b, 0);

const ACHIEVEMENTS = [
    { id: 'first_step', label: '🚀 First Step!', xp: 10, condition: (s: number) => s >= 1 },
    { id: 'identity_done', label: '🪪 Identity Complete', xp: 15, condition: (s: number) => s >= 3 },
    { id: 'ops_done', label: '⚙️ Ops Master', xp: 15, condition: (s: number) => s >= 6 },
    { id: 'strategist', label: '🧠 Strategist', xp: 20, condition: (s: number) => s >= 7 },
    { id: 'profile_hero', label: '👑 Profile Hero', xp: 30, condition: (s: number) => s >= 8 },
];

const MOTIVATIONAL = [
    "You're crushing it! 💪",
    "Almost there, keep going! 🔥",
    "This is looking amazing! ⚡",
    "You're a profiling pro! 🌟",
    "Legendary work! 🎉",
];

// ─── Achievement Toast ───────────────────────────────────────────────
const AchievementToast = ({ achievement, onClose }: { achievement: typeof ACHIEVEMENTS[0], onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
    >
        <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-3xl p-1 shadow-2xl shadow-amber-500/30">
            <div className="bg-white rounded-[22px] px-8 py-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                    <Trophy className="text-white" size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Achievement Unlocked!</p>
                    <p className="text-lg font-black text-gray-900">{achievement.label}</p>
                    <p className="text-xs font-bold text-amber-500">+{achievement.xp} XP</p>
                </div>
                <button onClick={onClose} className="ml-4 text-gray-300 hover:text-gray-500"><span className="text-xl">×</span></button>
            </div>
        </div>
    </motion.div>
);

// ─── Reusable Components ─────────────────────────────────────────────

const GameCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 p-6 md:p-8 hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
        {children}
    </motion.div>
);

const FieldLabel = ({ label, tooltip, emoji }: { label: string, tooltip?: string, emoji?: string }) => (
    <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2">
            {emoji && <span className="text-lg">{emoji}</span>}
            <label className="text-xs font-extrabold uppercase text-gray-600 tracking-wider">{label}</label>
        </div>
        {tooltip && <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{tooltip}</p>}
    </div>
);

const FormInput = ({ placeholder, value, onChange, type = "text", ...props }: any) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all duration-200 hover:border-gray-200"
        {...props}
    />
);

const ChoicePill = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`px-5 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wide transition-all duration-200 border-2 ${
            selected
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20'
                : 'bg-white text-gray-400 border-gray-100 hover:border-primary/30 hover:text-gray-600'
        }`}
    >
        {label}
    </motion.button>
);

const GameSelect = ({ value, onChange, children }: any) => (
    <select
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all duration-200 hover:border-gray-200 cursor-pointer"
    >
        {children}
    </select>
);

const XPBar = ({ currentXP, step, totalSteps }: { currentXP: number, step: number, totalSteps: number }) => {
    const pct = Math.min((currentXP / TOTAL_XP) * 100, 100);
    const level = step <= 2 ? 1 : step <= 4 ? 2 : step <= 6 ? 3 : 4;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-md">
                        {level}
                    </div>
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Lvl {level}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-primary">{currentXP} / {TOTAL_XP} XP</span>
                    <span className="text-[10px] font-bold text-gray-400">{step}/{totalSteps}</span>
                </div>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 via-primary to-blue-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </motion.div>
            </div>
        </div>
    );
};

// ─── Category Specific Questions ──────────────────────────────────────

const PublicCategoryQuestions = ({ type, responses, onChange }: { type: string, responses: any, onChange: (key: string, value: any) => void }) => {
    const renderQuestions = () => {
        if (type === 'Retail & Shops') {
            return (
                <>
                    <GameCard>
                        <FieldLabel label="Discovery Channel" tooltip="Where do most customers come from?" />
                        <div className="flex flex-wrap gap-2">
                            {['Walk-ins', 'Referrals', 'Social media', 'Online store', 'Repeat customers'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.discoveryChannel === opt} onClick={() => onChange('discoveryChannel', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Product Discovery Ease" tooltip="How do customers find products?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Easy', 'Medium', 'Hard'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.productDiscovery === opt} onClick={() => onChange('productDiscovery', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Wait Time" tooltip="Do customers wait before being attended?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                            ))}
                        </div>
                    </GameCard>
                </>
            );
        }
        
        if (type === 'Food & Hospitality') {
            return (
                <>
                    <GameCard>
                        <FieldLabel label="Ordering Process" tooltip="How do customers place orders?" />
                        <div className="flex flex-wrap gap-2">
                            {['Speak to staff', 'Self-service', 'Online / WhatsApp'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.orderingProcess === opt} onClick={() => onChange('orderingProcess', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Menu Visibility" tooltip="Do customers easily see the menu?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.menuVisibility === opt} onClick={() => onChange('menuVisibility', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Wait Time" tooltip="Wait before placing/receiving orders?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                            ))}
                        </div>
                    </GameCard>
                </>
            );
        }

        return (
            <GameCard className="text-center py-12">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="text-gray-300" />
                    </div>
                    <h3 className="font-black text-text-main">Advanced Analysis Active</h3>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto font-medium">Proceed to provide your scale and operational data for a custom AI report.</p>
                </div>
            </GameCard>
        );
    };

    return <div className="space-y-6">{renderQuestions()}</div>;
};

// ─── Main Public Gamified Component ───────────────────────────────────

export default function PublicProfilingForm() {
    const [step, setStep] = useState(1);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [showAchievement, setShowAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
    const [highestStep, setHighestStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinal, setIsFinal] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        location: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        businessType: 'Retail & Shops',
        niche: '',
        customerTraffic: 'Medium' as 'Low' | 'Medium' | 'High',
        numberOfBranches: '1',
        isDeviceReady: true,
        isInternetReady: true,
        responses: {} as Record<string, any>,
    });

    const currentXP = STEP_XP.slice(0, Math.min(highestStep, 8)).reduce((a, b) => a + b, 0);

    const handleResponseChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            responses: { ...prev.responses, [key]: value }
        }));
    };

    const fireConfetti = () => {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#10b981'] });
    };

    const validateStep = (currentStep: number) => {
        if (currentStep === 1) {
            if (!formData.businessName.trim()) { notify.error("Business Name is required"); return false; }
        }
        if (currentStep === 2) {
            if (!formData.contactEmail.trim()) { notify.error("Professional Email is required"); return false; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) { 
                notify.error("Please enter a valid email address"); 
                return false; 
            }
        }
        if (currentStep === 3) {
            if (!formData.niche.trim()) { notify.error("Please describe your business niche"); return false; }
        }
        return true;
    };

    const goNext = () => {
        if (!validateStep(step)) return;
        if (step < 8) {
            const nextStep = step + 1;
            setStep(nextStep);
            if (nextStep > highestStep) {
                setHighestStep(nextStep);
                ACHIEVEMENTS.forEach(a => {
                    if (a.condition(nextStep) && !unlockedAchievements.includes(a.id)) {
                        setUnlockedAchievements(prev => [...prev, a.id]);
                        setShowAchievement(a);
                        fireConfetti();
                        setTimeout(() => setShowAchievement(null), 3500);
                    }
                });
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        if (!validateStep(step)) return;
        setIsSubmitting(true);
        try {
            await businessProfilingApi.publicCreate(formData);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            setIsFinal(true);
        } catch (error) {
            notify.error("Failed to generate analysis. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFinal) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white border border-gray-100 rounded-[3rem] shadow-xl shadow-gray-100/50"
            >
                <div className="w-24 h-24 rounded-[2.5rem] bg-green-50 flex items-center justify-center mb-10 shadow-xl shadow-green-100/50">
                    <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-text-main mb-6 tracking-tight">Analysis Locked In!</h2>
                <p className="text-xl text-gray-400 max-w-lg leading-relaxed font-medium">
                    Our AI is now crunching the data for <strong>{formData.businessName}</strong>. Your surgical growth proposal will arrive at <strong>{formData.contactEmail}</strong> shortly.
                </p>
                <button 
                    onClick={() => window.location.href = '/'}
                    className="mt-12 px-12 py-6 bg-primary text-white text-xs font-black uppercase tracking-[0.3em] rounded-full hover:bg-primary-hover transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                >
                    Return to Portal
                </button>
            </motion.div>
        );
    }

    const meta = STEP_META[step - 1];
    const StepIcon = meta.icon;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Achievement Toast */}
            <AnimatePresence>{showAchievement && <AchievementToast achievement={showAchievement} onClose={() => setShowAchievement(null)} />}</AnimatePresence>

            {/* Header & Progress */}
            <div className="mb-12 space-y-8">
                <XPBar currentXP={currentXP} step={step} totalSteps={8} />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-xl shadow-primary/20`}>
                            <StepIcon className="text-white" size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Step {step} of 8</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">— {meta.title}</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-text-main tracking-tight leading-none">
                                {meta.subtitle}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                >
                    {step === 1 && (
                        <div className="space-y-6">
                            <GameCard>
                                <FieldLabel label="Business Name" emoji="🏪" />
                                <FormInput placeholder="e.g. Suya Kingdom" value={formData.businessName} onChange={(e:any) => setFormData({...formData, businessName: e.target.value})} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Location" emoji="📍" />
                                <FormInput placeholder="e.g. Wuse 2, Abuja" value={formData.location} onChange={(e:any) => setFormData({...formData, location: e.target.value})} />
                            </GameCard>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <GameCard>
                                <FieldLabel label="Full Name" emoji="👤" />
                                <FormInput placeholder="Your Name" value={formData.contactPerson} onChange={(e:any) => setFormData({...formData, contactPerson: e.target.value})} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Professional Email" emoji="📧" />
                                <FormInput type="email" placeholder="email@example.com" value={formData.contactEmail} onChange={(e:any) => setFormData({...formData, contactEmail: e.target.value})} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="WhatsApp Number" emoji="📱" />
                                <FormInput placeholder="+234..." value={formData.contactPhone} onChange={(e:any) => setFormData({...formData, contactPhone: e.target.value})} />
                            </GameCard>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <GameCard>
                                <FieldLabel label="Select Your Industry" emoji="🏢" />
                                <GameSelect value={formData.businessType} onChange={(e: any) => setFormData({ ...formData, businessType: e.target.value })}>
                                    {BUSINESS_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                                </GameSelect>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Your Niche" emoji="💎" tooltip="What exactly do you do? e.g. 'Handmade Furniture'" />
                                <FormInput placeholder="e.g. Luxury Spa, Tech Repair" value={formData.niche} onChange={(e:any) => setFormData({...formData, niche: e.target.value})} />
                            </GameCard>
                        </div>
                    )}

                    {step === 4 && (
                        <PublicCategoryQuestions 
                            type={formData.businessType} 
                            responses={formData.responses} 
                            onChange={handleResponseChange} 
                        />
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <GameCard>
                                <FieldLabel label="Daily Customer Traffic" emoji="🚶" />
                                <div className="grid grid-cols-3 gap-3">
                                    {['Low', 'Medium', 'High'].map(lvl => (
                                        <ChoicePill key={lvl} label={lvl} selected={formData.customerTraffic === lvl} onClick={() => setFormData({...formData, customerTraffic: lvl as any})} />
                                    ))}
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Number of Branches" emoji="🏗️" />
                                <FormInput type="number" min="1" value={formData.numberOfBranches} onChange={(e:any) => setFormData({...formData, numberOfBranches: e.target.value})} />
                            </GameCard>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6">
                            <GameCard>
                                <FieldLabel label="Do you collect customer data?" tooltip="Emails or phone numbers for marketing?" />
                                <div className="grid grid-cols-3 gap-3">
                                    {['Yes', 'Sometimes', 'No'].map(opt => (
                                        <ChoicePill key={opt} label={opt} selected={formData.responses.collectsData === opt} onClick={() => handleResponseChange('collectsData', opt)} />
                                    ))}
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Do you follow up with customers?" />
                                <div className="grid grid-cols-3 gap-3">
                                    {['Regularly', 'Sometimes', 'No'].map(opt => (
                                        <ChoicePill key={opt} label={opt} selected={formData.responses.followUp === opt} onClick={() => handleResponseChange('followUp', opt)} />
                                    ))}
                                </div>
                            </GameCard>
                        </div>
                    )}

                    {step === 7 && (
                        <div className="space-y-6">
                            <GameCard>
                                <FieldLabel label="Digital Presence" tooltip="Do you have a website or strong social media presence?" />
                                <div className="grid grid-cols-3 gap-3">
                                    {['Strong', 'Limited', 'None'].map(opt => (
                                        <ChoicePill key={opt} label={opt} selected={formData.responses.digitalPresence === opt} onClick={() => handleResponseChange('digitalPresence', opt)} />
                                    ))}
                                </div>
                            </GameCard>
                            <GameCard className="bg-primary/5 border-primary/10">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-text-main font-bold mb-1 uppercase text-[10px] tracking-widest">Privacy Guarantee</h4>
                                        <p className="text-gray-500 text-xs leading-relaxed">Your business data is used exclusively to generate your growth analysis. We do not share your info with third parties.</p>
                                    </div>
                                </div>
                            </GameCard>
                        </div>
                    )}

                    {step === 8 && (
                        <div className="space-y-6">
                            <GameCard className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20 py-12 text-center">
                                <div className="mb-6 relative inline-block">
                                    <Trophy className="text-yellow-500 w-20 h-20 animate-bounce" />
                                    <Sparkles className="absolute -top-2 -right-2 text-primary animate-pulse" />
                                </div>
                                <h3 className="text-3xl font-black text-text-main mb-2 uppercase tracking-tight">Ready for Launch!</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed font-medium">
                                    Click below to finalize your data and receive your personalized Vemtap growth strategy.
                                </p>
                            </GameCard>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <div className="hidden md:flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-gray-400">{MOTIVATIONAL[Math.min(Math.floor(step / 2), MOTIVATIONAL.length - 1)]}</span>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    {step > 1 && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={goBack}
                            className="px-8 py-5 rounded-2xl border-2 border-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:border-gray-200 transition-all flex items-center justify-center gap-3"
                        >
                            <ChevronLeft size={16} /> Previous
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={step === 8 ? handleSubmit : goNext}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none sm:min-w-[200px] px-10 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><Rocket className="animate-pulse" size={18} /> Processing...</>
                        ) : (
                            <>{step === 8 ? 'Generate Growth Report' : 'Next Phase'} <ChevronRight size={16} /></>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
