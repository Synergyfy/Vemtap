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
import { notify } from '@/lib/notify';
import confetti from 'canvas-confetti';

// ─── XP & Achievement System ─────────────────────────────────────────
const STEP_XP = [10, 15, 20, 10, 10, 15, 15, 20, 25, 30];
const TOTAL_XP = STEP_XP.reduce((a, b) => a + b, 0);

const ACHIEVEMENTS = [
    { id: 'first_step', label: '🚀 First Step!', xp: 10, condition: (s: number) => s >= 1 },
    { id: 'identity_done', label: '🪪 Identity Complete', xp: 15, condition: (s: number) => s >= 4 },
    { id: 'ops_done', label: '⚙️ Ops Master', xp: 15, condition: (s: number) => s >= 7 },
    { id: 'strategist', label: '🧠 Strategist', xp: 20, condition: (s: number) => s >= 9 },
    { id: 'profile_hero', label: '👑 Profile Hero', xp: 30, condition: (s: number) => s >= 10 },
];

const STEP_META = [
    { id: 1, title: 'Who Are You?', subtitle: "Let's meet this business!", icon: Building2, emoji: '👋', phase: 'Identity', color: 'from-violet-500 to-purple-600' },
    { id: 2, title: 'Your Vibe', subtitle: 'What makes them unique?', icon: Sparkles, emoji: '✨', phase: 'Identity', color: 'from-pink-500 to-rose-600' },
    { id: 3, title: 'Category Specifics', subtitle: 'Deep dive into their world!', icon: Target, emoji: '🎯', phase: 'Identity', color: 'from-indigo-500 to-blue-600' },
    { id: 4, title: 'Your Scale', subtitle: 'How big is the operation?', icon: TrendingUp, emoji: '📊', phase: 'Identity', color: 'from-blue-500 to-cyan-600' },
    { id: 5, title: 'First Impressions', subtitle: 'What do customers see first?', icon: Target, emoji: '👀', phase: 'Operations', color: 'from-amber-500 to-orange-600' },
    { id: 6, title: 'The Setup', subtitle: 'How is the space organized?', icon: MapPin, emoji: '🏗️', phase: 'Operations', color: 'from-emerald-500 to-green-600' },
    { id: 7, title: 'Customer Flow', subtitle: 'How do people move around?', icon: Rocket, emoji: '🌊', phase: 'Operations', color: 'from-teal-500 to-cyan-600' },
    { id: 8, title: 'QR Strategy', subtitle: 'Plan the placement attack!', icon: ClipboardList, emoji: '📍', phase: 'Strategy', color: 'from-indigo-500 to-blue-600' },
    { id: 9, title: 'Sales Plan', subtitle: 'Time to strategize the pitch!', icon: TrendingUp, emoji: '🎯', phase: 'Strategy', color: 'from-red-500 to-pink-600' },
    { id: 10, title: 'Final Boss', subtitle: 'Score, review & launch!', icon: Crown, emoji: '🏆', phase: 'Review', color: 'from-yellow-500 to-amber-600' },
];

const MOTIVATIONAL = [
    "You're crushing it! 💪",
    "Almost there, keep going! 🔥",
    "This is looking amazing! ⚡",
    "You're a profiling pro! 🌟",
    "Legendary work! 🎉",
];

const BUSINESS_CATEGORIES = [
    'Retail & Shops', 'Food & Hospitality', 'Beauty & Personal Care', 'Health & Medical',
    'Professional Services', 'Education & Training', 'Technology & Digital Service',
    'Real Estate & Property', 'Automotive', 'Logistics & Transportation',
    'Construction & Home Service', 'Event & Entertainment', 'Agriculture & Farming',
    'Finance & Financial Services', 'Government & Public Service', 'Religion & NGO', 'Other'
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
    const level = step <= 3 ? 1 : step <= 6 ? 2 : step <= 9 ? 3 : 4;

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

// ─── Category Specific Questions ──────────────────────────────────────

const CategorySpecificQuestions = ({ type, responses, onChange }: { type: string, responses: any, onChange: (key: string, value: any) => void }) => {
    if (type === 'Retail & Shops') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Retail Type" emoji="🛍️" />
                    <GameSelect value={responses.retailType || 'Clothing / Fashion'} onChange={(e: any) => onChange('retailType', e.target.value)}>
                        <option>Clothing / Fashion</option><option>Electronics</option><option>Supermarket / Grocery</option>
                        <option>Cosmetics / Beauty</option><option>Home / Furniture</option><option>Mixed Store</option><option>Other</option>
                    </GameSelect>
                </GameCard>
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
                    <FieldLabel label="Customer Questions Level" tooltip="Do they ask many questions before buying?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerQuestions === opt} onClick={() => onChange('customerQuestions', opt)} />
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
                <GameCard>
                    <FieldLabel label="Catalog Status" tooltip="Do you have a product catalog?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (digital)', 'Yes (printed)', 'No catalog'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.hasCatalog === opt} onClick={() => onChange('hasCatalog', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Collects Contact Info?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Sometimes', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Food & Hospitality') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Establishment Type" emoji="🍽️" />
                    <GameSelect value={responses.foodType || 'Restaurant'} onChange={(e: any) => onChange('foodType', e.target.value)}>
                        <option>Restaurant</option><option>Fast Food</option><option>Café</option><option>Bar / Lounge</option>
                        <option>Hotel</option><option>Catering</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Peak Period" tooltip="When is it busiest?" />
                    <div className="flex flex-wrap gap-2">
                        {['Morning', 'Afternoon', 'Evening', 'All day'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.peakPeriod === opt} onClick={() => onChange('peakPeriod', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Ordering Process" tooltip="How do customers place orders?" />
                    <div className="flex flex-wrap gap-2">
                        {['Speak to staff', 'Self-service', 'Online / WhatsApp'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.orderingProcess === opt} onClick={() => onChange('orderingProcess', opt)} />
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
                <GameCard>
                    <FieldLabel label="Menu Visibility" tooltip="Do customers easily see the menu?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.menuVisibility === opt} onClick={() => onChange('menuVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Collects Contact Info?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Sometimes', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Beauty & Personal Care') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Beauty Service Type" emoji="💇" />
                    <GameSelect value={responses.beautyType || 'Hair Salon'} onChange={(e: any) => onChange('beautyType', e.target.value)}>
                        <option>Hair Salon</option><option>Barbing Salon</option><option>Nail Studio</option>
                        <option>Spa / Massage</option><option>Makeup Artist</option><option>Skincare Studio</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Booking Process" tooltip="How do customers request services?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-in only', 'Phone/WhatsApp', 'Social DM', 'Booking system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingProcess === opt} onClick={() => onChange('bookingProcess', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Average wait before being served?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Knowledge" tooltip="Do customers know all your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceKnowledge === opt} onClick={() => onChange('serviceKnowledge', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Lost to Wait?" tooltip="Do customers leave because of waiting?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToWait === opt} onClick={() => onChange('lostToWait', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="No-Show Problem?" tooltip="How often do bookings not show up?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.noShow === opt} onClick={() => onChange('noShow', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Waiting Area Status" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'None'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingArea === opt} onClick={() => onChange('waitingArea', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Health & Medical') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Medical Facility Type" emoji="🏥" />
                    <GameSelect value={responses.medicalType || 'Clinic'} onChange={(e: any) => onChange('medicalType', e.target.value)}>
                        <option>Hospital</option><option>Clinic</option><option>Pharmacy</option>
                        <option>Dental Clinic</option><option>Eye Clinic</option><option>Lab / Diagnostic</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Wait before being attended?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Procedure Clarity" tooltip="Do patients understand your procedures?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.procedureClarity === opt} onClick={() => onChange('procedureClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Missed Appointments?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.forgetFollowups === opt} onClick={() => onChange('forgetFollowups', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-up Visits?" tooltip="Do you follow up after visits?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Sometimes', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpVisits === opt} onClick={() => onChange('followUpVisits', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Waiting Area Status" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'None'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingArea === opt} onClick={() => onChange('waitingArea', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Professional Services') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Service Type" emoji="⚖️" />
                    <GameSelect value={responses.profType || 'Law Firm'} onChange={(e: any) => onChange('profType', e.target.value)}>
                        <option>Law Firm</option><option>Accounting Firm</option><option>Business Consultant</option>
                        <option>Marketing Agency</option><option>HR Consulting</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Weekly Clients" tooltip="Average clients handled per week?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.weeklyClients === opt} onClick={() => onChange('weeklyClients', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Efficiency" tooltip="How fast do you respond to inquiries?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast', 'Medium', 'Slow'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do clients understand your pricing/services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Conversion Loss?" tooltip="Do you lose clients after consultation?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="No-Show Meetings?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.noShows === opt} onClick={() => onChange('noShows', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Presence" tooltip="Website, social links, strong portfolio?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPresence === opt} onClick={() => onChange('digitalPresence', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Education & Training') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Education Type" emoji="🎓" />
                    <GameSelect value={responses.eduType || 'School'} onChange={(e: any) => onChange('eduType', e.target.value)}>
                        <option>School (K-12)</option><option>Training Institute</option><option>Tech Bootcamp</option>
                        <option>Professional Cert</option><option>Online Courses</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Student Volume" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.studentVolume === opt} onClick={() => onChange('studentVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Registration Friction" tooltip="Do students struggle to enroll?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.registrationFriction === opt} onClick={() => onChange('registrationFriction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Course Clarity" tooltip="Are your programs clearly understood?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.courseClarity === opt} onClick={() => onChange('courseClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Drop-off Rate" tooltip="Do students lose interest before enrolling?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dropOffInterest === opt} onClick={() => onChange('dropOffInterest', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Issues?" tooltip="Low program completion rate?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionIssue === opt} onClick={() => onChange('retentionIssue', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Updates Level" tooltip="Do you communicate schedules/updates?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Sometimes', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.updatesLevel === opt} onClick={() => onChange('updatesLevel', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Technology & Digital Service') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Tech Service Type" emoji="💻" />
                    <GameSelect value={responses.techType || 'Software Dev'} onChange={(e: any) => onChange('techType', e.target.value)}>
                        <option>Software Dev</option><option>IT Support</option><option>Digital Marketing</option>
                        <option>Graphic Design</option><option>Cybersecurity</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Project Volume" tooltip="Monthly projects handled?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.projectVolume === opt} onClick={() => onChange('projectVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast', 'Medium', 'Slow'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do clients understand value/packages?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Project Drop-off?" tooltip="Abandon projects after starting?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.projectDropoff === opt} onClick={() => onChange('projectDropoff', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Portfolio Presence" tooltip="Website/Portfolio status?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.portfolioPresence === opt} onClick={() => onChange('portfolioPresence', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Onboarding Process" tooltip="Structured intake for clients?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.onboardingProcess === opt} onClick={() => onChange('onboardingProcess', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Real Estate & Property') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Real Estate Type" emoji="🏘️" />
                    <GameSelect value={responses.propertyType || 'Real Estate Agency'} onChange={(e: any) => onChange('propertyType', e.target.value)}>
                        <option>Real Estate Agency</option><option>Property Developer</option><option>Property Management</option>
                        <option>Land Sales Company</option><option>Facility Management</option><option>Short-let Management</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Monthly Leads" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.monthlyLeads === opt} onClick={() => onChange('monthlyLeads', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" tooltip="How fast do you respond to inquiries?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast', 'Medium', 'Slow'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Property Visibility" tooltip="Do clients clearly see all available properties?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.propertyVisibility === opt} onClick={() => onChange('propertyVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Conversion Loss?" tooltip="Do you lose clients after inquiry/inspection?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="No-Show Inspections?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.noShowInspections === opt} onClick={() => onChange('noShowInspections', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Platform Status" tooltip="Do you have a listing system or platform?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Automotive') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Automotive Type" emoji="🚗" />
                    <GameSelect value={responses.autoType || 'Car Dealership'} onChange={(e: any) => onChange('autoType', e.target.value)}>
                        <option>Car Dealership</option><option>Used Car Dealer</option><option>Car Rental</option>
                        <option>Mechanic Workshop</option><option>Auto Spare Parts</option><option>Car Wash</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Daily Customers" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dailyCustomers === opt} onClick={() => onChange('dailyCustomers', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Average wait before service starts?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do customers understand your prices/process?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Lost to Delay?" tooltip="Do customers leave because of waiting?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToDelay === opt} onClick={() => onChange('lostToDelay', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Rate" tooltip="Do customers return after first service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High', 'Medium', 'Low'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionRate === opt} onClick={() => onChange('retentionRate', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Visible Signage?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.hasSignage === opt} onClick={() => onChange('hasSignage', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Logistics & Transportation') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Logistics Type" emoji="🚚" />
                    <GameSelect value={responses.logisticsType || 'Courier Service'} onChange={(e: any) => onChange('logisticsType', e.target.value)}>
                        <option>Courier Service</option><option>Delivery Company</option><option>Logistics Company</option>
                        <option>Trucking Services</option><option>Bike Delivery</option><option>Bus Transport</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Daily Requests" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dailyRequests === opt} onClick={() => onChange('dailyRequests', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast', 'Medium', 'Slow'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Tracking Capability" tooltip="Can customers track deliveries/trips?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.trackingCapability === opt} onClick={() => onChange('trackingCapability', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Delivery Delays?" tooltip="Do trips/deliveries get delayed often?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.deliveryDelays === opt} onClick={() => onChange('deliveryDelays', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Cancellation Rate" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.cancellationRate === opt} onClick={() => onChange('cancellationRate', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Ops Status" tooltip="Structured system for dispatch/ops?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalOperations === opt} onClick={() => onChange('digitalOperations', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Construction & Home Service') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Construction Type" emoji="🏗️" />
                    <GameSelect value={responses.constructionType || 'Construction Company'} onChange={(e: any) => onChange('constructionType', e.target.value)}>
                        <option>Construction Company</option><option>Interior Design</option><option>Architecture Firm</option>
                        <option>Plumbing Services</option><option>Electrical Installation</option><option>Cleaning Services</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Monthly Jobs" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.monthlyJobs === opt} onClick={() => onChange('monthlyJobs', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast', 'Medium', 'Slow'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do clients understand pricing/services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Quote Delay?" tooltip="Delay in approval after receiving quote?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.quoteDelay === opt} onClick={() => onChange('quoteDelay', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Conversion Loss?" tooltip="Do you lose jobs after giving a quote?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Job Cancellations" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.jobCancellations === opt} onClick={() => onChange('jobCancellations', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Presence" tooltip="Website or online portfolio status?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPresence === opt} onClick={() => onChange('digitalPresence', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Event & Entertainment') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Event Type" emoji="🎭" />
                    <GameSelect value={responses.eventType || 'Event Planning'} onChange={(e: any) => onChange('eventType', e.target.value)}>
                        <option>Event Planning</option><option>Wedding Planner</option><option>Event Venue</option>
                        <option>Photography</option><option>Decor Services</option><option>Equipment Rental</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Monthly Events" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.monthlyEvents === opt} onClick={() => onChange('monthlyEvents', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast', 'Medium', 'Slow'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Portfolio Visibility" tooltip="Do clients clearly see your past work?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.portfolioVisibility === opt} onClick={() => onChange('portfolioVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Conversion Loss?" tooltip="Do you lose clients after quotation?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Booking Cancellations" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingCancellations === opt} onClick={() => onChange('bookingCancellations', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Presence" tooltip="Website or social portfolio status?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPresence === opt} onClick={() => onChange('digitalPresence', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Agriculture & Farming') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Agric Type" emoji="🌽" />
                    <GameSelect value={responses.agricType || 'Crop Farming'} onChange={(e: any) => onChange('agricType', e.target.value)}>
                        <option>Crop Farming</option><option>Livestock Farming</option><option>Poultry Farm</option>
                        <option>Fish Farm</option><option>Agro Processing</option><option>Agric Supply</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Production Volume" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.productionVolume === opt} onClick={() => onChange('productionVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Ordering Friction" tooltip="Do buyers struggle to place orders?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.orderingFriction === opt} onClick={() => onChange('orderingFriction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Communication Level" tooltip="Do buyers complain about response?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.communicationLevel === opt} onClick={() => onChange('communicationLevel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Product Visibility" tooltip="Can buyers clearly see available produce?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.productVisibility === opt} onClick={() => onChange('productVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Conversion Loss?" tooltip="Do you lose buyers after inquiry?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Issues?" tooltip="Do buyers fail to return?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionIssue === opt} onClick={() => onChange('retentionIssue', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Platform Status" tooltip="Do you have a digital catalog?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Finance & Financial Services') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Finance Type" emoji="💰" />
                    <GameSelect value={responses.financeType || 'Bank'} onChange={(e: any) => onChange('financeType', e.target.value)}>
                        <option>Bank</option><option>Microfinance</option><option>Fintech</option>
                        <option>POS Business</option><option>Insurance</option><option>Investment</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Customer Volume" tooltip="Transaction volume daily/weekly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerVolume === opt} onClick={() => onChange('customerVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Wait before being attended?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do customers clearly understand products?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Transaction Hesitation" tooltip="Do customers delay completing transactions?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.transactionHesitation === opt} onClick={() => onChange('transactionHesitation', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Transaction Drop-off" tooltip="Lose customers before completion?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.transactionDropoff === opt} onClick={() => onChange('transactionDropoff', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Problem?" tooltip="Fail to return after first transaction?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionProblem === opt} onClick={() => onChange('retentionProblem', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Platform Status" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Government & Public Service') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Gov Service Type" emoji="🏛️" />
                    <GameSelect value={responses.govType || 'Public Agency'} onChange={(e: any) => onChange('govType', e.target.value)}>
                        <option>Government Office</option><option>Public Agency</option><option>Utility Service</option>
                        <option>Healthcare Facility</option><option>Public School</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Citizen Volume" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.citizenVolume === opt} onClick={() => onChange('citizenVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Queue Time" tooltip="Wait time before being attended?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.queueTime === opt} onClick={() => onChange('queueTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Procedure Clarity" tooltip="Do citizens understand requirements?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.procedureClarity === opt} onClick={() => onChange('procedureClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Unprepared Citizens" tooltip="Come with wrong/missing documents?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.unpreparedCitizens === opt} onClick={() => onChange('unpreparedCitizens', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Multiple Returns?" tooltip="Return multiple times for one task?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.multipleReturns === opt} onClick={() => onChange('multipleReturns', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Platform Status" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Religion & NGO') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Org Type" emoji="⛪" />
                    <GameSelect value={responses.orgType || 'Church'} onChange={(e: any) => onChange('orgType', e.target.value)}>
                        <option>Church</option><option>Mosque</option><option>NGO</option>
                        <option>Charity</option><option>Foundation</option><option>Other</option>
                    </GameSelect>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Member Volume" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.memberVolume === opt} onClick={() => onChange('memberVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Missed Updates" tooltip="Do members miss important info?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.missedUpdates === opt} onClick={() => onChange('missedUpdates', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Event Awareness" tooltip="Do members clearly know programs?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.eventAwareness === opt} onClick={() => onChange('eventAwareness', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Attendance Issues?" tooltip="Fail to attend after showing interest?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lowAttendance === opt} onClick={() => onChange('lowAttendance', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Donation Struggle" tooltip="Struggle with collecting donations?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.donationStruggle === opt} onClick={() => onChange('donationStruggle', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Irregular Giving" tooltip="Donors fail to contribute regularly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.irregularGiving === opt} onClick={() => onChange('irregularGiving', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Platform Status" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Other') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="What does your business do?" emoji="✨" />
                    <GameTextarea placeholder="Explain your unique business model..." value={responses.businessDescription || ''} onChange={(e: any) => onChange('businessDescription', e.target.value)} rows={3} />
                </GameCard>
                <GameCard>
                    <FieldLabel label="Closest Category" tooltip="Map your business structure" />
                    <div className="flex flex-wrap gap-2">
                        {['Retail', 'Service-based', 'Production', 'Digital/Online', 'Mixed'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.closestCategory === opt} onClick={() => onChange('closestCategory', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Customer Volume" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerVolume === opt} onClick={() => onChange('customerVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Communication Delays" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.communicationDelays === opt} onClick={() => onChange('communicationDelays', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Offering Clarity" tooltip="Are offerings well understood?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Partially', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.offeringClarity === opt} onClick={() => onChange('offeringClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Contact Drop-off" tooltip="Lose customers after initial contact?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.contactDropoff === opt} onClick={() => onChange('contactDropoff', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Level" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High', 'Medium', 'Low'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionLevel === opt} onClick={() => onChange('retentionLevel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Presence" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPresence === opt} onClick={() => onChange('digitalPresence', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    return (
        <GameCard className="text-center py-12">
            <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="text-gray-400" />
                </div>
                <h3 className="font-black text-gray-900">Standard Profiling Active</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">Specific questions for "{type}" are coming soon. Proceed with general profiling.</p>
            </div>
        </GameCard>
    );
};

// ─── Main Gamified Component ─────────────────────────────────────────
export default function GamifiedNewProfile({ onSave, isSaving }: { onSave: (data: BusinessProfileFormData) => void, isSaving?: boolean }) {
    const [step, setStep] = useState(1);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [showAchievement, setShowAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
    const [highestStep, setHighestStep] = useState(1);

    const [formData, setFormData] = useState<BusinessProfileFormData>({
        businessName: '', location: '', contactPerson: '', contactEmail: '', contactPhone: '', numberOfBranches: '1',
        businessType: 'Retail & Shops', niche: '', customerTraffic: 'Medium',
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
        responses: {},
    });

    const currentXP = STEP_XP.slice(0, Math.min(highestStep, 10)).reduce((a, b) => a + b, 0);

    const handleCheckboxChange = useCallback((field: keyof BusinessProfileFormData, value: string) => {
        setFormData(prev => {
            const current = prev[field] as string[];
            return { ...prev, [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] };
        });
    }, []);

    const handleRatingChange = useCallback((field: keyof BusinessProfileFormData, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleResponseChange = useCallback((key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            responses: { ...prev.responses, [key]: value }
        }));
    }, []);

    const fireConfetti = () => {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#10b981'] });
    };
const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
        if (!formData.businessName?.trim()) { notify.error("Business Name is required"); return false; }
        if (!formData.contactEmail?.trim()) { notify.error("Contact Email is required"); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) { notify.error("Please enter a valid email address"); return false; }
    }
    if (currentStep === 2) {
        if (!formData.niche?.trim()) { notify.error("Please describe the business niche"); return false; }
    }
    return true;
};

const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 10) {
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
                    <XPBar currentXP={currentXP} totalXP={TOTAL_XP} step={step} totalSteps={10} />

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
                                <span className="text-[10px] font-bold text-gray-400">Step {step}/10</span>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <GameCard>
                                    <FieldLabel label="Contact Person" emoji="🤝" tooltip="Who's our first friend at the door?" />
                                    <GameInput placeholder="e.g. Chef Emeka" value={formData.contactPerson} onChange={(e: any) => setFormData({ ...formData, contactPerson: e.target.value })} />
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Contact Email" emoji="📧" tooltip="Mandatory for the growth analysis report." />
                                    <GameInput type="email" placeholder="owner@business.com" value={formData.contactEmail} onChange={(e: any) => setFormData({ ...formData, contactEmail: e.target.value })} />
                                </GameCard>
                            </div>
                            <GameCard>
                                <FieldLabel label="Contact Phone" emoji="📱" tooltip="WhatsApp number for quick follow-up." />
                                <GameInput placeholder="e.g. +234..." value={formData.contactPhone} onChange={(e: any) => setFormData({ ...formData, contactPhone: e.target.value })} />
                            </GameCard>
                        </div>
                    )}

                    {/* ── STEP 2: Your Vibe ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <GameCard>
                                <FieldLabel label="Business Type" emoji="🏢" tooltip="What kind of hustle is this?" />
                                <GameSelect value={formData.businessType} onChange={(e: any) => setFormData({ ...formData, businessType: e.target.value })}>
                                    {BUSINESS_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
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

                    {/* ── STEP 3: Category Specifics ── */}
                    {step === 3 && (
                        <CategorySpecificQuestions 
                            type={formData.businessType} 
                            responses={formData.responses} 
                            onChange={handleResponseChange} 
                        />
                    )}

                    {/* ── STEP 4: Your Scale ── */}
                    {step === 4 && (
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

                    {/* ── STEP 5: First Impressions ── */}
                    {step === 5 && (
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

                    {/* ── STEP 6: The Setup ── */}
                    {step === 6 && (
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

                    {/* ── STEP 7: Customer Flow ── */}
                    {step === 7 && (
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

                    {/* ── STEP 8: QR Strategy ── */}
                    {step === 8 && (
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

                    {/* ── STEP 9: Sales Plan ── */}
                    {step === 9 && (
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

                    {/* ── STEP 10: Final Boss ── */}
                    {step === 10 && (
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
                        {step < 10 ? (
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
