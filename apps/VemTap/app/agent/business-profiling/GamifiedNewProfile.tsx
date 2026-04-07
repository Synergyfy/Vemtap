'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2, MapPin, ClipboardList, TrendingUp, CheckCircle2,
    ChevronRight, ChevronLeft, Zap, HelpCircle, User, Sparkles,
    Trophy, Star, Rocket, Target, Crown, PartyPopper, Heart,
    ShieldCheck, ArrowRight, Gift
} from 'lucide-react';
import { BusinessProfileFormData } from '@/lib/api/business-profiling';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// ─── XP & Achievement System ─────────────────────────────────────────
const STEP_XP = [10, 15, 10, 10, 15, 15, 20, 25, 30];
const TOTAL_XP = STEP_XP.reduce((a, b) => a + b, 0);

const ACHIEVEMENTS = [
    { id: 'first_step', label: '🚀 First Step!', xp: 10, condition: (s: number) => s >= 1 },
    { id: 'identity_done', label: '🪪 Identity Complete', xp: 15, condition: (s: number) => s >= 3 },
    { id: 'ops_done', label: '⚙️ Ops Master', xp: 15, condition: (s: number) => s >= 6 },
    { id: 'strategist', label: '🧠 Strategist', xp: 20, condition: (s: number) => s >= 8 },
    { id: 'profile_hero', label: '👑 Profile Hero', xp: 30, condition: (s: number) => s >= 9 },
];

const STEP_META = [
    { id: 1, title: 'Who Are You?', subtitle: "Let's meet this business!", icon: Building2, emoji: '👋', phase: 'Identity', color: 'from-violet-500 to-purple-600' },
    { id: 2, title: 'Your Vibe', subtitle: 'What makes them unique?', icon: Sparkles, emoji: '✨', phase: 'Identity', color: 'from-pink-500 to-rose-600' },
    { id: 3, title: 'Your Scale', subtitle: 'How big is the operation?', icon: TrendingUp, emoji: '📊', phase: 'Identity', color: 'from-blue-500 to-cyan-600' },
    { id: 4, title: 'First Impressions', subtitle: 'What do customers see first?', icon: Target, emoji: '👀', phase: 'Operations', color: 'from-amber-500 to-orange-600' },
    { id: 5, title: 'The Setup', subtitle: 'How is the space organized?', icon: MapPin, emoji: '🏗️', phase: 'Operations', color: 'from-emerald-500 to-green-600' },
    { id: 6, title: 'Customer Flow', subtitle: 'How do people move around?', icon: Rocket, emoji: '🌊', phase: 'Operations', color: 'from-teal-500 to-cyan-600' },
    { id: 7, title: 'QR Strategy', subtitle: 'Plan the placement attack!', icon: ClipboardList, emoji: '📍', phase: 'Strategy', color: 'from-indigo-500 to-blue-600' },
    { id: 8, title: 'Sales Plan', subtitle: 'Time to strategize the pitch!', icon: TrendingUp, emoji: '🎯', phase: 'Strategy', color: 'from-red-500 to-pink-600' },
    { id: 9, title: 'Final Boss', subtitle: 'Score, review & launch!', icon: Crown, emoji: '🏆', phase: 'Review', color: 'from-yellow-500 to-amber-600' },
];

const MOTIVATIONAL = [
    "You're crushing it! 💪",
    "Almost there, keep going! 🔥",
    "This is looking amazing! ⚡",
    "You're a profiling pro! 🌟",
    "Legendary work! 🎉",
];

// ─── Reusable Components ─────────────────────────────────────────────

const GameCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
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

const GameInput = ({ placeholder, value, onChange, type = "text", ...props }: any) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all duration-200 hover:border-gray-200"
        {...props}
    />
);

const GameTextarea = ({ placeholder, value, onChange, rows = 3 }: any) => (
    <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all duration-200 hover:border-gray-200 resize-none"
    />
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

const ChoicePill = ({ label, selected, onClick, color = "primary" }: { label: string, selected: boolean, onClick: () => void, color?: string }) => (
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

const GameToggle = ({ value, onChange, label }: { value: boolean, onChange: () => void, label?: string }) => (
    <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={onChange}
        className="flex items-center gap-4 w-full p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all"
    >
        {label && <span className="flex-1 text-sm font-bold text-gray-600 text-left">{label}</span>}
        <div className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex ${value ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200'}`}>
            <motion.div
                layout
                className="w-6 h-6 rounded-full bg-white shadow-md"
                style={{ marginLeft: value ? 'auto' : 0 }}
            />
        </div>
    </motion.button>
);

const RatingStars = ({ value, onChange, max = 5 }: { value: number, onChange: (v: number) => void, max?: number }) => (
    <div className="flex gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((num) => (
            <motion.button
                key={num}
                type="button"
                whileHover={{ scale: 1.15, rotate: num <= value ? 0 : 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange(num)}
                className={`w-12 h-12 rounded-2xl font-extrabold text-lg transition-all duration-200 border-2 ${
                    num <= value
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-amber-400 shadow-lg shadow-amber-200/50'
                        : 'bg-gray-50 text-gray-300 border-gray-100 hover:border-amber-200'
                }`}
            >
                {num <= value ? '⭐' : num}
            </motion.button>
        ))}
    </div>
);

// ─── Achievement Toast ───────────────────────────────────────────────
const AchievementToast = ({ achievement, onClose }: { achievement: typeof ACHIEVEMENTS[0], onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50"
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

// ─── XP Progress Bar ─────────────────────────────────────────────────
const XPBar = ({ currentXP, totalXP, step, totalSteps }: { currentXP: number, totalXP: number, step: number, totalSteps: number }) => {
    const pct = Math.min((currentXP / totalXP) * 100, 100);
    const level = step <= 3 ? 1 : step <= 6 ? 2 : step <= 8 ? 3 : 4;

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
                    <span className="text-xs font-black text-primary">{currentXP} / {totalXP} XP</span>
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

// ─── Main Gamified Component ─────────────────────────────────────────
export default function GamifiedNewProfile({ onSave, isSaving }: { onSave: (data: BusinessProfileFormData) => void, isSaving?: boolean }) {
    const [step, setStep] = useState(1);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [showAchievement, setShowAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
    const [highestStep, setHighestStep] = useState(1);

    const [formData, setFormData] = useState<BusinessProfileFormData>({
        businessName: '', location: '', contactPerson: '', numberOfBranches: '1',
        businessType: 'Restaurant', niche: '', customerTraffic: 'Medium',
        targetCustomers: [], hasGlassDoor: false, outsideFootTraffic: 'Low',
        hasWaitingArea: false, hasTables: false, hasCounterOrdering: false,
        queueSystem: 'Organized', serviceStyle: 'Both', customerFlowNote: '',
        useWindowQR: false, windowQRType: 'None', indoorPlacement: [],
        specialUse: [], suggestedPackage: 'Growth', packageReason: '',
        customPitch: '', problemsNoticed: [], bestTimeToApproach: 'Morning',
        whoToSpeakTo: 'Owner', approachStyle: 'Friendly', demoItems: [],
        isDeviceReady: false, isInternetReady: false, offers: [],
        closingPlan: '', rateFootTraffic: 3, rateNeed: 3,
        rateAbilityToPay: 3, rateEaseOfAdoption: 3,
        status: 'Not Contacted',
        xpEarned: 0,
        achievements: [],
    });

    const currentXP = STEP_XP.slice(0, Math.min(highestStep, 9)).reduce((a, b) => a + b, 0);

    const handleCheckboxChange = useCallback((field: keyof BusinessProfileFormData, value: string) => {
        setFormData(prev => {
            const current = prev[field] as string[];
            return { ...prev, [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] };
        });
    }, []);

    const handleRatingChange = useCallback((field: keyof BusinessProfileFormData, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const fireConfetti = () => {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#10b981'] });
    };

    const goNext = () => {
        if (step < 9) {
            const nextStep = step + 1;
            setStep(nextStep);
            if (nextStep > highestStep) {
                setHighestStep(nextStep);
                // Check achievements
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
    };

    const goBack = () => { if (step > 1) setStep(step - 1); };

    const meta = STEP_META[step - 1];
    const StepIcon = meta.icon;
    const phaseColors: Record<string, string> = {
        'Identity': 'bg-violet-100 text-violet-700',
        'Operations': 'bg-emerald-100 text-emerald-700',
        'Strategy': 'bg-blue-100 text-blue-700',
        'Review': 'bg-amber-100 text-amber-700',
    };

    return (
        <div className="max-w-3xl mx-auto pb-36">
            {/* Achievement Toast */}
            <AnimatePresence>{showAchievement && <AchievementToast achievement={showAchievement} onClose={() => setShowAchievement(null)} />}</AnimatePresence>

            {/* Header Card */}
            <GameCard className="mb-6 overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-[0.03]`} />
                <div className="relative z-10 space-y-5">
                    <XPBar currentXP={currentXP} totalXP={TOTAL_XP} step={step} totalSteps={9} />

                    {/* Step Pills */}
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {STEP_META.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => s.id <= highestStep && setStep(s.id)}
                                disabled={s.id > highestStep}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap text-[10px] font-bold ${
                                    step === s.id
                                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                        : s.id <= highestStep
                                            ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer'
                                            : 'bg-gray-50/50 text-gray-300 cursor-not-allowed'
                                }`}
                            >
                                <span>{s.emoji}</span>
                                <span className="hidden sm:inline">{s.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </GameCard>

            {/* Step Title */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg`}>
                            <StepIcon className="text-white" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${phaseColors[meta.phase]}`}>{meta.phase}</span>
                                <span className="text-[10px] font-bold text-gray-400">Step {step}/9</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <span>{meta.emoji}</span> {meta.title}
                            </h2>
                            <p className="text-sm text-gray-400 font-medium">{meta.subtitle}</p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Form Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                >
                    {/* ── STEP 1: Who Are You? ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Business Name" emoji="🏪" tooltip="The official or trading name – make it count!" />
                                <GameInput placeholder="e.g. Mama Nkechi Suya Spot" value={formData.businessName} onChange={(e: any) => setFormData({ ...formData, businessName: e.target.value })} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Location (Area)" emoji="📍" tooltip="Where can we find them? Neighborhood or city region." />
                                <GameInput placeholder="e.g. Wuse 2, Abuja" value={formData.location} onChange={(e: any) => setFormData({ ...formData, location: e.target.value })} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Contact Person" emoji="🤝" tooltip="Who's our first friend at the door?" />
                                <GameInput placeholder="e.g. Chef Emeka" value={formData.contactPerson} onChange={(e: any) => setFormData({ ...formData, contactPerson: e.target.value })} />
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 2: Your Vibe ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Business Type" emoji="🏢" tooltip="What kind of hustle is this?" />
                                <GameSelect value={formData.businessType} onChange={(e: any) => setFormData({ ...formData, businessType: e.target.value })}>
                                    <option>Restaurant</option><option>Salon / Barber</option><option>Fashion Store</option><option>Supermarket</option><option>Other</option>
                                </GameSelect>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Niche (Specific)" emoji="💎" tooltip="e.g. 'Vegan Fine Dining' vs 'Fast Food' – the secret sauce!" />
                                <GameInput placeholder="e.g. Afro-fusion, Unisex grooming" value={formData.niche} onChange={(e: any) => setFormData({ ...formData, niche: e.target.value })} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Target Customers" emoji="👥" tooltip="Who walks through their doors? Pick all that apply!" />
                                <div className="flex flex-wrap gap-3">
                                    {['Students', 'Families', 'Professionals', 'Mixed'].map((tag) => (
                                        <ChoicePill key={tag} label={tag} selected={formData.targetCustomers.includes(tag)} onClick={() => handleCheckboxChange('targetCustomers', tag)} />
                                    ))}
                                </div>
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 3: Your Scale ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Customer Traffic" emoji="🚶" tooltip="How busy is this place on a regular day?" />
                                <div className="grid grid-cols-3 gap-3">
                                    {['Low', 'Medium', 'High'].map((lvl) => (
                                        <ChoicePill key={lvl} label={`${lvl === 'Low' ? '🐢' : lvl === 'Medium' ? '🚶' : '🏃'} ${lvl}`} selected={formData.customerTraffic === lvl} onClick={() => setFormData({ ...formData, customerTraffic: lvl as any })} />
                                    ))}
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Number of Locations" emoji="🏗️" tooltip="How many branches are we dealing with?" />
                                <GameInput type="number" min="1" placeholder="e.g. 1" value={formData.numberOfBranches} onChange={(e: any) => setFormData({ ...formData, numberOfBranches: e.target.value })} />
                                <div className="mt-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                                    <p className="text-xs font-bold text-violet-600 flex items-center gap-2"><Sparkles size={14} /> {parseInt(formData.numberOfBranches) > 3 ? "Enterprise territory! 🔥" : parseInt(formData.numberOfBranches) > 1 ? "Multi-location — nice!" : "Single location setup."}</p>
                                </div>
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 4: First Impressions ── */}
                    {step === 4 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Glass Door / Window?" emoji="🪟" tooltip="Can we stick QR codes on glass surfaces?" />
                                <GameToggle value={formData.hasGlassDoor} onChange={() => setFormData({ ...formData, hasGlassDoor: !formData.hasGlassDoor })} label={formData.hasGlassDoor ? "Yes! Glass surfaces available 🪟" : "No glass doors/windows"} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Outside Foot Traffic" emoji="🚶‍♂️" tooltip="How many people walk past the storefront?" />
                                <div className="grid grid-cols-2 gap-3">
                                    {['Low', 'High'].map((lvl) => (
                                        <ChoicePill key={lvl} label={`${lvl === 'Low' ? '🌙 Quiet street' : '🔥 Busy area!'}`} selected={formData.outsideFootTraffic === lvl} onClick={() => setFormData({ ...formData, outsideFootTraffic: lvl as any })} />
                                    ))}
                                </div>
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 5: The Setup ── */}
                    {step === 5 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Waiting Area?" emoji="💺" tooltip="Is there a spot where customers chill?" />
                                <GameToggle value={formData.hasWaitingArea} onChange={() => setFormData({ ...formData, hasWaitingArea: !formData.hasWaitingArea })} label={formData.hasWaitingArea ? "Yes, they wait here! 💺" : "No dedicated waiting area"} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Tables / Seating?" emoji="🪑" tooltip="Table stands could live here!" />
                                <GameToggle value={formData.hasTables} onChange={() => setFormData({ ...formData, hasTables: !formData.hasTables })} label={formData.hasTables ? "Tables everywhere! 🪑" : "No seating setup"} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Service Style" emoji="🍽️" tooltip="How do they serve their customers?" />
                                <div className="grid grid-cols-3 gap-3">
                                    {['Dine-in', 'Takeaway', 'Both'].map((style) => (
                                        <ChoicePill key={style} label={style} selected={formData.serviceStyle === style} onClick={() => setFormData({ ...formData, serviceStyle: style as any })} />
                                    ))}
                                </div>
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 6: Customer Flow ── */}
                    {step === 6 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Counter Ordering?" emoji="🧾" tooltip="Do customers order at a counter?" />
                                <GameToggle value={formData.hasCounterOrdering} onChange={() => setFormData({ ...formData, hasCounterOrdering: !formData.hasCounterOrdering })} label={formData.hasCounterOrdering ? "Counter ordering is active! 🧾" : "No counter ordering"} />
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Queue System" emoji="📋" tooltip="How organized is the line?" />
                                <div className="grid grid-cols-2 gap-3">
                                    <ChoicePill label="✅ Organized" selected={formData.queueSystem === 'Organized'} onClick={() => setFormData({ ...formData, queueSystem: 'Organized' as any })} />
                                    <ChoicePill label="😵 Chaos!" selected={formData.queueSystem !== 'Organized'} onClick={() => setFormData({ ...formData, queueSystem: 'Not organized (Chaos)' as any })} />
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Flow Notes" emoji="📝" tooltip="How do customers walk in, browse, and pay? Paint the picture!" />
                                <GameTextarea placeholder="e.g. Customers walk in, check the menu board, order at the counter, then sit and wait..." value={formData.customerFlowNote} onChange={(e: any) => setFormData({ ...formData, customerFlowNote: e.target.value })} rows={4} />
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 7: QR Strategy ── */}
                    {step === 7 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Window QR?" emoji="🖼️" tooltip="Capture attention from outside!" />
                                <GameToggle value={formData.useWindowQR} onChange={() => setFormData({ ...formData, useWindowQR: !formData.useWindowQR, windowQRType: formData.useWindowQR ? 'None' : 'Sticker' })} label={formData.useWindowQR ? "Window QR activated! 🖼️" : "No window QR"} />
                                {formData.useWindowQR && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Sticker', 'Banner'].map((type) => (
                                                <ChoicePill key={type} label={type} selected={formData.windowQRType === type} onClick={() => setFormData({ ...formData, windowQRType: type as any })} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Indoor Placement Map" emoji="🗺️" tooltip="Where inside can QR/NFC tags live? Select all!" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {['Table Stand', 'Wall Poster', 'Countertop QR', 'NFC Tag', 'Reception Desk', 'Roll-up Banner'].map((place) => (
                                        <ChoicePill key={place} label={place} selected={formData.indoorPlacement.includes(place)} onClick={() => handleCheckboxChange('indoorPlacement', place)} />
                                    ))}
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Special Scenarios" emoji="🎭" tooltip="Creative engagement opportunities!" />
                                <div className="space-y-3">
                                    {['Waiting queue engagement', 'Pre-order before entry', 'Service selection'].map((scenario) => (
                                        <motion.button
                                            key={scenario} type="button" whileTap={{ scale: 0.97 }}
                                            onClick={() => handleCheckboxChange('specialUse', scenario)}
                                            className={`w-full p-5 rounded-2xl text-sm font-bold text-left transition-all border-2 flex items-center justify-between ${
                                                formData.specialUse.includes(scenario) ? 'bg-primary/5 text-primary border-primary/30 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            {scenario}
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.specialUse.includes(scenario) ? 'bg-primary border-primary' : 'border-gray-200'}`}>
                                                {formData.specialUse.includes(scenario) && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 8: Sales Plan ── */}
                    {step === 8 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Recommended Package" emoji="📦" tooltip="Which tier fits them best?" />
                                <div className="grid grid-cols-3 gap-3">
                                    {[{n:'Starter',e:'🌱'},{n:'Growth',e:'🚀'},{n:'Premium',e:'👑'}].map(({n,e}) => (
                                        <ChoicePill key={n} label={`${e} ${n}`} selected={formData.suggestedPackage === n} onClick={() => setFormData({ ...formData, suggestedPackage: n as any })} />
                                    ))}
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Package Rationale" emoji="💡" tooltip="Why does THIS tier fit them?" />
                                <GameTextarea placeholder="e.g. They have 3 branches and need multi-location management..." value={formData.packageReason} onChange={(e: any) => setFormData({ ...formData, packageReason: e.target.value })} />
                            </GameCard>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <GameCard>
                                    <FieldLabel label="Target Stakeholder" emoji="🎯" tooltip="Who's the decision maker?" />
                                    <div className="space-y-2">
                                        {['Owner', 'Manager', 'Supervisor'].map((p) => (
                                            <ChoicePill key={p} label={p} selected={formData.whoToSpeakTo === p} onClick={() => setFormData({ ...formData, whoToSpeakTo: p as any })} />
                                        ))}
                                    </div>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Approach Timing" emoji="⏰" tooltip="Best time to pitch!" />
                                    <div className="space-y-2">
                                        {[{v:'Morning',e:'🌅'},{v:'Afternoon',e:'☀️'},{v:'Evening',e:'🌇'}].map(({v,e}) => (
                                            <ChoicePill key={v} label={`${e} ${v}`} selected={formData.bestTimeToApproach === v} onClick={() => setFormData({ ...formData, bestTimeToApproach: v as any })} />
                                        ))}
                                    </div>
                                </GameCard>
                            </div>
                            <GameCard>
                                <FieldLabel label="Pain Points Observed" emoji="🩹" tooltip="What problems did you spot?" />
                                <div className="flex flex-wrap gap-3">
                                    {['Long waiting time', 'No database', 'Poor engagement', 'Manual ordering', 'No marketing'].map((prob) => (
                                        <ChoicePill key={prob} label={prob} selected={formData.problemsNoticed.includes(prob)} onClick={() => handleCheckboxChange('problemsNoticed', prob)} />
                                    ))}
                                </div>
                            </GameCard>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <GameCard>
                                    <FieldLabel label="Pitch Style" emoji="🎤" tooltip="How should we approach them?" />
                                    <GameSelect value={formData.approachStyle} onChange={(e: any) => setFormData({ ...formData, approachStyle: e.target.value })}>
                                        <option>Friendly</option><option>Direct</option><option>Demo first</option><option>Talk first</option>
                                    </GameSelect>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Demo Toolkit" emoji="🧰" tooltip="What to show off!" />
                                    <div className="space-y-2">
                                        {['QR scan -> Order flow', 'Customer capture', 'Dashboard'].map((item) => (
                                            <ChoicePill key={item} label={item} selected={formData.demoItems.includes(item)} onClick={() => handleCheckboxChange('demoItems', item)} />
                                        ))}
                                    </div>
                                </GameCard>
                            </div>
                            <GameCard>
                                <FieldLabel label="Field Readiness" emoji="✅" tooltip="Is everything ready for a live demo?" />
                                <div className="grid grid-cols-2 gap-4">
                                    <GameToggle value={formData.isDeviceReady} onChange={() => setFormData({ ...formData, isDeviceReady: !formData.isDeviceReady })} label={formData.isDeviceReady ? "📱 Device Ready" : "📱 Device?"} />
                                    <GameToggle value={formData.isInternetReady} onChange={() => setFormData({ ...formData, isInternetReady: !formData.isInternetReady })} label={formData.isInternetReady ? "📶 Internet Ready" : "📶 Internet?"} />
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Custom Pitch Hook" emoji="🪝" tooltip="WHY does this business need Vemtap RIGHT NOW?" />
                                <GameTextarea placeholder="e.g. They're losing repeat customers because they have no loyalty system..." value={formData.customPitch} onChange={(e: any) => setFormData({ ...formData, customPitch: e.target.value })} rows={3} />
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 9: Final Boss ── */}
                    {step === 9 && (
                        <div className="space-y-5">
                            <GameCard className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
                                <div className="text-center space-y-3 mb-8">
                                    <span className="text-5xl">🏆</span>
                                    <h3 className="text-xl font-black text-gray-900">Final Boss: Rate & Review!</h3>
                                    <p className="text-sm text-gray-500">Score this business and seal the deal</p>
                                </div>
                                <div className="space-y-8">
                                    <div><FieldLabel label="Foot Traffic" emoji="🚶" tooltip="Volume of physical visitors" /><RatingStars value={formData.rateFootTraffic} onChange={(v) => handleRatingChange('rateFootTraffic', v)} /></div>
                                    <div><FieldLabel label="Need for Vemtap" emoji="💡" tooltip="How much would they benefit?" /><RatingStars value={formData.rateNeed} onChange={(v) => handleRatingChange('rateNeed', v)} /></div>
                                    <div><FieldLabel label="Ability to Pay" emoji="💰" tooltip="Financial capacity estimate" /><RatingStars value={formData.rateAbilityToPay} onChange={(v) => handleRatingChange('rateAbilityToPay', v)} /></div>
                                    <div><FieldLabel label="Ease of Adoption" emoji="⚡" tooltip="How tech-savvy is their setup?" /><RatingStars value={formData.rateEaseOfAdoption} onChange={(v) => handleRatingChange('rateEaseOfAdoption', v)} /></div>
                                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 flex items-center justify-between mt-6">
                                        <span className="text-sm font-black text-white uppercase tracking-wider">Total Score</span>
                                        <span className="text-4xl font-black text-primary">{formData.rateFootTraffic + formData.rateNeed + formData.rateAbilityToPay + formData.rateEaseOfAdoption}<span className="text-lg text-gray-500"> / 20</span></span>
                                    </div>
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Offer Strategy" emoji="🎁" tooltip="Sweeten the deal!" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {['Free trial', 'Discount', 'Free QR setup'].map((offer) => (
                                        <ChoicePill key={offer} label={`🎁 ${offer}`} selected={formData.offers.includes(offer)} onClick={() => handleCheckboxChange('offers', offer)} />
                                    ))}
                                </div>
                            </GameCard>
                            <GameCard>
                                <FieldLabel label="Closing Plan" emoji="🎯" tooltip="What's the endgame after the demo?" />
                                <GameTextarea placeholder="e.g. Get them to sign up for free trial on the spot..." value={formData.closingPlan} onChange={(e: any) => setFormData({ ...formData, closingPlan: e.target.value })} rows={3} />
                            </GameCard>
                            <GameCard className="bg-yellow-50/50 border-yellow-100">
                                <FieldLabel label="Summary Notes" emoji="📔" tooltip="Any extra observations?" />
                                <GameTextarea placeholder="Anything else worth noting about this prospect..." value={formData.summaryNotes || ''} onChange={(e: any) => setFormData({ ...formData, summaryNotes: e.target.value })} rows={3} />
                            </GameCard>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 lg:p-5 z-40">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden md:flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-gray-400">{MOTIVATIONAL[Math.min(Math.floor(step / 2), MOTIVATIONAL.length - 1)]}</span>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        {step > 1 && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={goBack}
                                className="flex-1 md:w-28 py-4 bg-gray-50 text-gray-600 font-extrabold uppercase tracking-wider text-[11px] rounded-2xl border-2 border-gray-100 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={16} /> Back
                            </motion.button>
                        )}
                        {step < 9 ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={goNext}
                                className="flex-1 md:w-48 py-4 bg-gradient-to-r from-primary to-violet-600 text-white font-extrabold uppercase tracking-wider text-[11px] rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                            >
                                Continue <ChevronRight size={16} />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={isSaving}
                                onClick={() => { 
                                    fireConfetti(); 
                                    onSave({
                                        ...formData,
                                        xpEarned: currentXP,
                                        achievements: unlockedAchievements
                                    }); 
                                }}
                                className={`flex-1 md:w-72 py-4 font-extrabold uppercase tracking-wider text-[11px] rounded-2xl transition-all flex items-center justify-center gap-2 ${
                                    isSaving ? 'bg-gray-400 text-white cursor-not-allowed animate-pulse' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/25 hover:shadow-2xl'
                                }`}
                            >
                                {isSaving ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing AI Insights...</>
                                ) : (
                                    <><Trophy size={16} /> Finalize & Launch! 🚀</>
                                )}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
