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
    { id: 3, title: 'Discovery & Scale', subtitle: 'Understanding their volume', icon: Target, emoji: '🎯', phase: 'Operations', color: 'from-indigo-500 to-blue-600' },
    { id: 4, title: 'Experience & Flow', subtitle: 'How do customers interact?', icon: Rocket, emoji: '🌊', phase: 'Operations', color: 'from-teal-500 to-cyan-600' },
    { id: 5, title: 'Sales & Retention', subtitle: 'Where are they losing out?', icon: TrendingUp, emoji: '📊', phase: 'Operations', color: 'from-red-500 to-pink-600' },
    { id: 6, title: 'Marketing & Setup', subtitle: 'Visibility and spaces', icon: MapPin, emoji: '🏗️', phase: 'Operations', color: 'from-amber-500 to-green-600' },
    { id: 7, title: 'Deep Dive Issues', subtitle: 'The biggest bottlenecks', icon: Target, emoji: '🔥', phase: 'Operations', color: 'from-rose-500 to-red-600' },
    { id: 8, title: 'QR Strategy', subtitle: 'Plan the targeted placement!', icon: ClipboardList, emoji: '📍', phase: 'Strategy', color: 'from-blue-500 to-indigo-600' },
    { id: 9, title: 'Sales Pitch', subtitle: 'Time to strategize the pitch!', icon: User, emoji: '🤝', phase: 'Strategy', color: 'from-emerald-500 to-green-600' },
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
    'Construction & Home Services', 'Event & Entertainment', 'Agriculture & Farming',
    'Finance & Financial Services', 'Government & Public Services', 'Religion & NGO', 'Other'
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

// ─── Service Type Selector (Extracted) ──────────────────────────────
const ServiceTypeSelector = ({ type, responses, onChange }: { type: string, responses: any, onChange: (key: string, value: any) => void }) => {
    if (type === 'Retail & Shops') {
        return (
            <GameCard>
                <FieldLabel label="Retail Type" emoji="🛍️" />
                <GameSelect value={responses.retailType || 'Clothing / Fashion'} onChange={(e: any) => onChange('retailType', e.target.value)}>
                    <option>Clothing / Fashion</option><option>Electronics</option><option>Supermarket / Grocery</option>
                    <option>Cosmetics / Beauty</option><option>Home / Furniture</option><option>Mixed Store</option><option>Other</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Food & Hospitality') {
        return (
            <GameCard>
                <FieldLabel label="Establishment Type" emoji="🍽️" />
                <GameSelect value={responses.foodType || 'Restaurant'} onChange={(e: any) => onChange('foodType', e.target.value)}>
                    <option>Restaurant</option><option>Fast Food / Quick Service</option><option>Local Food Canteen / Bukka</option>
                    <option>Café / Coffee Shop</option><option>Bakery</option><option>Ice Cream Shop</option><option>Juice / Smoothie Bar</option>
                    <option>Bar / Lounge</option><option>Nightclub</option><option>Catering Services</option><option>Event Food Vendor</option>
                    <option>Hotel</option><option>Guest House</option><option>Short-let Apartment</option><option>Resort</option><option>Other</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Beauty & Personal Care') {
        return (
            <GameCard>
                <FieldLabel label="Beauty Service Type" emoji="💇" />
                <GameSelect value={responses.beautyType || 'Hair Salon'} onChange={(e: any) => onChange('beautyType', e.target.value)}>
                    <option>Hair Salon</option><option>Barbing Salon</option><option>Nail Studio</option><option>Spa / Massage</option>
                    <option>Makeup Artist</option><option>Skincare / Facial Studio</option><option>Beauty Clinic</option><option>Tattoo Studio</option>
                    <option>Piercing Studio</option><option>Cosmetics Studio</option><option>Other</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Health & Medical') {
        return (
            <GameCard>
                <FieldLabel label="Medical Facility Type" emoji="🏥" />
                <GameSelect value={responses.medicalType || 'Clinic'} onChange={(e: any) => onChange('medicalType', e.target.value)}>
                    <option>Hospital</option><option>Clinic</option><option>Dental Clinic</option><option>Eye Clinic / Optometrist</option>
                    <option>Pharmacy</option><option>Laboratory / Diagnostic Center</option><option>Physiotherapy</option>
                    <option>Mental Health / Therapy Center</option><option>Maternity Center</option><option>Medical Supply Store</option><option>Other</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Professional Services') {
        return (
            <GameCard>
                <FieldLabel label="Service Type" emoji="⚖️" />
                <GameSelect value={responses.profType || 'Law Firm'} onChange={(e: any) => onChange('profType', e.target.value)}>
                    <option>Law Firm / Legal Services</option><option>Accounting / Audit Firm</option><option>Tax Consultant</option>
                    <option>Business Consultant</option><option>Marketing Agency</option><option>Branding Agency</option>
                    <option>Advertising Agency</option><option>HR Consulting</option><option>Management Consulting</option>
                    <option>Public Relations (PR)</option><option>Other</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Education & Training') {
        return (
            <GameCard>
                <FieldLabel label="Education Type" emoji="🎓" />
                <GameSelect value={responses.eduType || 'School'} onChange={(e: any) => onChange('eduType', e.target.value)}>
                    <option>Nursery / Primary School</option><option>Secondary School</option><option>University / Polytechnic</option>
                    <option>Private Tutor</option><option>Training Institute</option><option>Professional Certification Training</option>
                    <option>Tech Bootcamp</option><option>Driving School</option><option>Music School</option><option>Language School</option>
                    <option>Online Course Provider</option><option>Coaching Center</option><option>Other</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Technology & Digital Service') {
        return (
            <GameCard>
                <FieldLabel label="Tech Service Type" emoji="💻" />
                <GameSelect value={responses.techType || 'Software Development'} onChange={(e: any) => onChange('techType', e.target.value)}>
                    <option>Software Development</option><option>Website Development</option><option>Mobile App Development</option>
                    <option>IT Support Services</option><option>Cybersecurity Services</option><option>Data & Analytics Services</option>
                    <option>SaaS / Tech Platform</option><option>Digital Marketing Agency</option><option>Social Media Management</option>
                    <option>Graphic Design</option><option>UI/UX Design</option><option>Printing & Branding Services</option>
                    <option>Computer Repair</option><option>Phone Repair</option><option>Internet Service Provider</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Real Estate & Property') {
        return (
            <GameCard>
                <FieldLabel label="Real Estate Type" emoji="🏘️" />
                <GameSelect value={responses.propertyType || 'Real Estate Agency'} onChange={(e: any) => onChange('propertyType', e.target.value)}>
                    <option>Real Estate Agency</option><option>Property Developer</option><option>Property Management</option>
                    <option>Land Sales Company</option><option>Facility Management</option><option>Surveying Services</option>
                    <option>Estate Valuation</option><option>Short-let Management</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Automotive') {
        return (
            <GameCard>
                <FieldLabel label="Automotive Type" emoji="🚗" />
                <GameSelect value={responses.autoType || 'Car Dealership'} onChange={(e: any) => onChange('autoType', e.target.value)}>
                    <option>Car Dealership</option><option>Used Car Dealer</option><option>Car Rental</option><option>Mechanic Workshop</option>
                    <option>Auto Spare Parts</option><option>Car Wash</option><option>Auto Electrical Repair</option><option>Tire Shop</option>
                    <option>Vehicle Inspection</option><option>Vehicle Tracking Services</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Logistics & Transportation') {
        return (
            <GameCard>
                <FieldLabel label="Logistics Service Type" emoji="🚚" tooltip="The specific nature of your transportation or delivery service." />
                <GameSelect value={responses.logisticsType || 'Courier Service'} onChange={(e: any) => onChange('logisticsType', e.target.value)}>
                    <option>Courier Service</option><option>Delivery Company</option><option>Logistics Company</option><option>Trucking Services</option>
                    <option>Bike Delivery</option><option>Moving Company</option><option>Bus Transport Company</option><option>Taxi / Ride Hailing</option>
                    <option>Freight Forwarding</option><option>Shipping Company</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Construction & Home Services') {
        return (
            <GameCard>
                <FieldLabel label="Construction Type" emoji="🏗️" />
                <GameSelect value={responses.constructionType || 'Construction Company'} onChange={(e: any) => onChange('constructionType', e.target.value)}>
                    <option>Construction Company</option><option>Building Contractor</option><option>Architecture Firm</option>
                    <option>Interior Design</option><option>Plumbing Services</option><option>Electrical Installation</option>
                    <option>Painting Services</option><option>Carpentry</option><option>Tiling Services</option><option>Welding / Metal Fabrication</option>
                    <option>Cleaning Services</option><option>Pest Control</option><option>Security Services</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Event & Entertainment') {
        return (
            <GameCard>
                <FieldLabel label="Event Type" emoji="🎭" />
                <GameSelect value={responses.eventType || 'Event Planning'} onChange={(e: any) => onChange('eventType', e.target.value)}>
                    <option>Event Planning</option><option>Wedding Planner</option><option>Event Hall / Venue</option><option>DJ Services</option>
                    <option>Photography</option><option>Videography</option><option>MC / Host</option><option>Equipment Rental</option>
                    <option>Stage & Lighting</option><option>Decor Services</option><option>Entertainment Company</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Finance & Financial Services') {
        return (
            <GameCard>
                <FieldLabel label="Financial Service Type" emoji="💰" />
                <GameSelect value={responses.financeType || 'Bank'} onChange={(e: any) => onChange('financeType', e.target.value)}>
                    <option>Bank</option><option>Microfinance Bank</option><option>Fintech Company</option><option>POS Agent / POS Business</option>
                    <option>Bureau De Change</option><option>Insurance Company</option><option>Investment Company</option><option>Loan Services</option>
                    <option>Mortgage Services</option><option>Cooperative Society</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Agriculture & Farming') {
        return (
            <GameCard>
                <FieldLabel label="Agric Business Type" emoji="🌽" tooltip="The specific sector of agriculture you operate in." />
                <GameSelect value={responses.agricType || 'Crop Farming'} onChange={(e: any) => onChange('agricType', e.target.value)}>
                    <option>Crop Farming</option><option>Livestock Farming</option><option>Poultry Farm</option><option>Fish Farm</option>
                    <option>Agro Processing</option><option>Farm Produce Trading</option><option>Fertilizer & Farm Input Supply</option>
                    <option>Agricultural Equipment Supply</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Government & Public Services') {
        return (
            <GameCard>
                <FieldLabel label="Gov Service Type" emoji="🏛️" tooltip="The primary public service your department provides." />
                <GameSelect value={responses.govType || 'Public Agency'} onChange={(e: any) => onChange('govType', e.target.value)}>
                    <option>Government Office</option><option>Public Agency</option><option>Utility Service</option>
                    <option>Healthcare Facility</option><option>Public School</option><option>Other</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Religious & Non-Profit Organizations' || type === 'Religion & NGO') {
        return (
            <GameCard>
                <FieldLabel label="Organization Type" emoji="💡" tooltip="The specific focus of your non-profit or religious body." />
                <GameSelect value={responses.orgType || 'Church'} onChange={(e: any) => onChange('orgType', e.target.value)}>
                    <option>Church</option><option>Mosque</option><option>NGO</option><option>Charity Organization</option>
                    <option>Foundation</option><option>Community Organization</option><option>Others</option>
                </GameSelect>
            </GameCard>
        );
    }

    if (type === 'Other') {
        return (
            <GameCard>
                <FieldLabel label="What does your business do?" emoji="❓" tooltip="A brief description of your main activities." />
                <GameTextarea placeholder="Explain your unique business model, products, and services offered..." value={responses.businessDescription || ''} onChange={(e: any) => onChange('businessDescription', e.target.value)} rows={3} />
            </GameCard>
        );
    }

    return null;
};

// ─── Category Specific Questions ──────────────────────────────────────
const CategorySpecificQuestions = ({ type, responses, onChange }: { type: string, responses: any, onChange: (key: string, value: any) => void }) => {
    if (type === 'Retail & Shops') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Daily Customer Traffic" tooltip="How many customers visit the shop daily?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-30)', 'Medium (31-100)', 'High (100+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerTraffic === opt} onClick={() => onChange('customerTraffic', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Discovery Channel" tooltip="Where do most customers come from?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-ins', 'Referrals', 'Social media', 'Online store', 'Repeat customers'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.discoveryChannel === opt} onClick={() => onChange('discoveryChannel', opt)} />
                        ))}
                    </div>
                </GameCard>
                
                {/* Section 2: Experience */}
                <GameCard>
                    <FieldLabel label="Product Discovery Ease" tooltip="How do customers find products?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Easy (Clear UI)', 'Medium (Training Needed)', 'Hard (Complex)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.productDiscovery === opt} onClick={() => onChange('productDiscovery', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-Sale Questions" tooltip="Do customers ask many questions before buying?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerQuestions === opt} onClick={() => onChange('customerQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Do customers wait before being attended?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-5m)', 'Medium (6-15m)', 'High (15m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Sales Process */}
                <GameCard>
                    <FieldLabel label="Sales Flow" tooltip="How do customers buy products?" />
                    <div className="flex flex-wrap gap-2">
                        {['Pick and pay directly', 'Ask staff then buy', 'Online order + pickup'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.salesFlow === opt} onClick={() => onChange('salesFlow', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Out of Stock Loss" tooltip="Do you lose sales because items are not available?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-20%)', 'High (20%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.outOfStockLoss === opt} onClick={() => onChange('outOfStockLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Purchase Abandonment" tooltip="Do customers abandon purchase before paying?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.purchaseAbandonment === opt} onClick={() => onChange('purchaseAbandonment', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Visibility */}
                <GameCard>
                    <FieldLabel label="Product Knowledge" tooltip="Do customers know all your products?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Some)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.productKnowledge === opt} onClick={() => onChange('productKnowledge', opt)} />
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

                {/* Section 6: Marketing */}
                <GameCard>
                    <FieldLabel label="Promotional Channels" tooltip="How do you let people know about your services?" />
                    <div className="flex flex-wrap gap-2">
                        {['Social media', 'Flyers', 'Radio', 'Referrals'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.marketingChannel === opt} onClick={() => onChange('marketingChannel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Offer Awareness" tooltip="Do customers know about new products or offers?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Not yet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.marketingAwareness === opt} onClick={() => onChange('marketingAwareness', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical Setup */}
                <GameCard>
                    <FieldLabel label="Entrance Visibility" tooltip="Visible entrance or window?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Hidden)', 'No (Blockage)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.entranceVisibility === opt} onClick={() => onChange('entranceVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Time Spent Inside" tooltip="Do customers spend time inside?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5m)', 'Medium (5-20m)', 'High (20m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.timeInside === opt} onClick={() => onChange('timeInside', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="QR Placement Spots" tooltip="Areas to place QR codes?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Many)', 'Limited (Some)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.qrSpots === opt} onClick={() => onChange('qrSpots', opt)} />
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
                    <FieldLabel label="Daily Customers Served" tooltip="How many customers do you serve daily?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-50)', 'Medium (51-150)', 'High (150+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerTraffic === opt} onClick={() => onChange('customerTraffic', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Peak Period" tooltip="When is it busiest?" />
                    <div className="flex flex-wrap gap-2">
                        {['Morning', 'Afternoon', 'Evening', 'All day'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.peakPeriod === opt} onClick={() => onChange('peakPeriod', opt)} />
                        ))}
                    </div>
                </GameCard>
                
                {/* Section 2: Experience */}
                <GameCard>
                    <FieldLabel label="Ordering Process" tooltip="How do customers place orders?" />
                    <div className="flex flex-wrap gap-2">
                        {['Speak to staff', 'Self-service (menu)', 'Online / WhatsApp'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.orderingProcess === opt} onClick={() => onChange('orderingProcess', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Wait before placing/receiving orders?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-2m)', 'Medium (3-10m)', 'High (10m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Slow Service Complaints" tooltip="Do customers complain about slow service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.complaints === opt} onClick={() => onChange('complaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Ordering & Menu Visibility */}
                <GameCard>
                    <FieldLabel label="Menu Visibility" tooltip="Do customers easily see the menu?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Vague)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.menuVisibility === opt} onClick={() => onChange('menuVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Menu Questions" tooltip="Do customers ask many questions about menu items?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.menuQuestions === opt} onClick={() => onChange('menuQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Ordering Indecision" tooltip="Do customers change their mind while ordering?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.changeMind === opt} onClick={() => onChange('changeMind', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales & Order Flow */}
                <GameCard>
                    <FieldLabel label="Lost to Queues" tooltip="Do you lose customers due to long queues?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-20%)', 'High (20%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostCustomers === opt} onClick={() => onChange('lostCustomers', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Order Cancellations" tooltip="Do customers cancel orders after placing them?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.orderCancellations === opt} onClick={() => onChange('orderCancellations', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Data Retention (Notification) */}
                <GameCard>
                    <FieldLabel label="Promotional Notifications" tooltip="Do you notify customers about offers?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regular)', 'Sometimes (Rare)', 'No (Not at all)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.notifyOffers === opt} onClick={() => onChange('notifyOffers', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Physical Setup */}
                <GameCard>
                    <FieldLabel label="Entrance Signage" tooltip="Visible entrance or signage?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Bright)', 'Partially (Faded)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.entranceVisibility === opt} onClick={() => onChange('entranceVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Time Spent (Dwell)" tooltip="Do customers sit and spend time in your space?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10m)', 'Medium (10-30m)', 'High (30m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.timeInside === opt} onClick={() => onChange('timeInside', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="QR Placement Areas" tooltip="Tables, counters, or waiting areas available?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Many (All areas)', 'Limited (Some)', 'None (Counter only)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.qrPlacementAreas === opt} onClick={() => onChange('qrPlacementAreas', opt)} />
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
                    <FieldLabel label="Daily Customers Served" tooltip="How many customers do you serve daily?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-20)', 'Medium (21-60)', 'High (60+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerTraffic === opt} onClick={() => onChange('customerTraffic', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Customer Acquisition" tooltip="How do customers usually come to you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-ins', 'Appointment / Booking', 'Social media', 'Referrals'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerSource === opt} onClick={() => onChange('customerSource', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Booking & Waiting Experience */}
                <GameCard>
                    <FieldLabel label="Booking Process" tooltip="How do customers book or request your service?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-in only', 'Phone call / WhatsApp', 'Social media DM', 'Structured booking system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingProcess === opt} onClick={() => onChange('bookingProcess', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Do customers wait before they are attended to?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-5m)', 'Medium (6-20m)', 'High (20m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Waiting Time Complaints" tooltip="Do customers complain about waiting time?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitComplaints === opt} onClick={() => onChange('waitComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Service Delivery */}
                <GameCard>
                    <FieldLabel label="Service Visibility" tooltip="Do customers know all the services you offer?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear list)', 'Partially (Vague)', 'No (Ask staff)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceKnowledge === opt} onClick={() => onChange('serviceKnowledge', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service/Price Questions" tooltip="Do customers ask many questions about services or prices?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceQuestions === opt} onClick={() => onChange('serviceQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Indecision" tooltip="Do customers change their choice after discussion?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.choiceChange === opt} onClick={() => onChange('choiceChange', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales & Customer Loss */}
                <GameCard>
                    <FieldLabel label="Lost to Wait" tooltip="Do you lose customers because they don't want to wait?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToWait === opt} onClick={() => onChange('lostToWait', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Booking No-Shows" tooltip="Do customers fail to show up after booking?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.noShow === opt} onClick={() => onChange('noShow', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Data Retention Reminders */}
                <GameCard>
                    <FieldLabel label="Repeat Reminders" tooltip="Do you remind customers for repeat services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.repeatReminders === opt} onClick={() => onChange('repeatReminders', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Visibility */}
                <GameCard>
                    <FieldLabel label="Marketing Channels" tooltip="How do you let people know about your services?" />
                     <div className="flex flex-wrap gap-2">
                        {['Social media', 'Walk-ins', 'Referrals', 'Ads'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.marketingChannels === opt} onClick={() => onChange('marketingChannels', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Latest Offers Awareness" tooltip="Do customers know your latest services or offers?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.offersAwareness === opt} onClick={() => onChange('offersAwareness', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical Setup */}
                <GameCard>
                    <FieldLabel label="Waiting Area Status" tooltip="Appearance and comfort level of your waiting area." />
                    <div className="grid grid-cols-3 gap-2">
                        {['Premium', 'Standard', 'Basic'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingAreaStatus === opt} onClick={() => onChange('waitingAreaStatus', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Time Spent Waiting" tooltip="Do customers spend time waiting or relaxing?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.timeWaiting === opt} onClick={() => onChange('timeWaiting', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="QR Placement Areas" tooltip="Are there areas to place QR codes?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Many spots', 'Limited', 'None'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.qrSpots === opt} onClick={() => onChange('qrSpots', opt)} />
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
                    <FieldLabel label="Daily Patient Volume" tooltip="How many patients/customers do you attend to daily?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-30)', 'Medium (31-100)', 'High (100+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerTraffic === opt} onClick={() => onChange('customerTraffic', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Patient Source" tooltip="How do patients usually come to you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-ins', 'Appointment / Booking', 'Referrals', 'Emergency visits'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.patientSource === opt} onClick={() => onChange('patientSource', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Appointment & Waiting Experience */}
                <GameCard>
                    <FieldLabel label="Booking Process" tooltip="How do patients book appointments?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-in only', 'Phone call', 'WhatsApp', 'Structured booking system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingProcess === opt} onClick={() => onChange('bookingProcess', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Do patients wait before being attended to?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-10m)', 'Medium (11-30m)', 'High (30+m)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time Complaints" tooltip="Do patients complain about waiting time?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitComplaints === opt} onClick={() => onChange('waitComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Service Flow & Information */}
                <GameCard>
                    <FieldLabel label="Procedure Clarity" tooltip="Do patients clearly understand your services or procedures?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Vague)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.procedureClarity === opt} onClick={() => onChange('procedureClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Inquiry Level" tooltip="Do patients ask many questions before treatment?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.questionsBefore === opt} onClick={() => onChange('questionsBefore', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Appointment Retention" tooltip="Do patients miss appointments or fail to return?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.missedAppointments === opt} onClick={() => onChange('missedAppointments', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Operational Challenges */}
                <GameCard>
                    <FieldLabel label="Loss to Wait" tooltip="Do you lose patients due to long waiting time?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-20%)', 'High (20%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToWait === opt} onClick={() => onChange('lostToWait', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Missed Follow-ups" tooltip="Do patients forget appointments or follow-ups?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.forgetFollowups === opt} onClick={() => onChange('forgetFollowups', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Follow-up & Communication */}
                <GameCard>
                    <FieldLabel label="Care Follow-up" tooltip="Do you follow up after visits?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpVisits === opt} onClick={() => onChange('followUpVisits', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Patient Awareness */}
                <GameCard>
                    <FieldLabel label="Service Awareness" tooltip="Do patients know about your latest updates or services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.awarenessLevel === opt} onClick={() => onChange('awarenessLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical Setup */}
                <GameCard>
                    <FieldLabel label="Waiting Area Status" tooltip="Appearance and comfort level of your waiting area." />
                    <div className="grid grid-cols-3 gap-2">
                        {['Premium', 'Standard', 'Basic'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingAreaStatus === opt} onClick={() => onChange('waitingAreaStatus', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Patient Dwell Time" tooltip="Do patients spend much time waiting?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10m)', 'Medium (10-30m)', 'High (30m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dwellTime === opt} onClick={() => onChange('dwellTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="QR Placement Sites" tooltip="Areas to place QR codes?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Many spots', 'Limited', 'None'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.qrSpots === opt} onClick={() => onChange('qrSpots', opt)} />
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
                    <FieldLabel label="Weekly Client Volume" tooltip="How many clients do you handle weekly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-10)', 'Medium (11-40)', 'High (40+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.weeklyClients === opt} onClick={() => onChange('weeklyClients', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Client Discovery" tooltip="How do clients usually find you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Referrals', 'Social media', 'Website', 'Walk-ins'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.clientSource === opt} onClick={() => onChange('clientSource', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Client Engagement */}
                <GameCard>
                    <FieldLabel label="Booking Method" tooltip="How do clients book or request your service?" />
                    <div className="flex flex-wrap gap-2">
                        {['Phone call', 'WhatsApp', 'Email', 'Structured booking system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingProcess === opt} onClick={() => onChange('bookingProcess', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" tooltip="Average delay in communication or service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Fast)', 'Medium (Some delay)', 'High (Long delay)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Complaints" tooltip="Do clients complain about slow response?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.slowResponseComplaints === opt} onClick={() => onChange('slowResponseComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Service Clarity & Communication */}
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do clients clearly understand your services and pricing?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Unsure)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-Engagement Inquiry" tooltip="Do clients ask many questions before engaging your service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.preEngageQuestions === opt} onClick={() => onChange('preEngageQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Decision Hesitation" tooltip="Do clients delay decision after consultation?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.decisionDelay === opt} onClick={() => onChange('decisionDelay', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales & Client Loss */}
                <GameCard>
                    <FieldLabel label="Consultation Drop-off" tooltip="Do you lose clients after initial consultation?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Meeting No-Shows" tooltip="Do clients fail to show up for meetings?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.noShows === opt} onClick={() => onChange('noShows', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Follow-up */}
                <GameCard>
                    <FieldLabel label="Lead Nurturing" tooltip="Do you follow up with potential or past clients?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rare)', 'No (Not yet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpPotential === opt} onClick={() => onChange('followUpPotential', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Positioning */}
                <GameCard>
                    <FieldLabel label="Perceived Value" tooltip="Do clients understand the value of your service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Fully)', 'Sometimes (Unsure)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valueUnderstanding === opt} onClick={() => onChange('valueUnderstanding', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Promotion Intensity" tooltip="Do you actively promote your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Not at all)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Office & Digital Setup */}
                <GameCard>
                    <FieldLabel label="Office Presence" tooltip="Do you have a physical office or meeting space?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Dedicated)', 'Shared (Co-working)', 'No (Remote)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.officeType === opt} onClick={() => onChange('officeType', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Team Engagement" tooltip="Do clients spend time waiting or interacting with your team?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dwellEngagement === opt} onClick={() => onChange('dwellEngagement', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness" tooltip="Website, social links, or strong portfolio?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Limited (Basic)', 'No (None)'].map(opt => (
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
                    <FieldLabel label="Current Student Count" tooltip="How many students do you have currently?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-50)', 'Medium (51-200)', 'High (200+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.studentVolume === opt} onClick={() => onChange('studentVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Student Discovery" tooltip="How do students usually find you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Referrals', 'Social media', 'Walk-ins', 'Online search'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.studentSource === opt} onClick={() => onChange('studentSource', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Enrollment Process */}
                <GameCard>
                    <FieldLabel label="Enrollment Method" tooltip="How do students enroll in your program?" />
                    <div className="flex flex-wrap gap-2">
                        {['Physical registration', 'Phone / WhatsApp', 'Online form', 'Structured system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.enrollmentMethod === opt} onClick={() => onChange('enrollmentMethod', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Registration Friction" tooltip="Do students delay or struggle to complete registration?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Easy)', 'Medium (Some delay)', 'High (Many struggle)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.registrationFriction === opt} onClick={() => onChange('registrationFriction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-Enrollment Inquiries" tooltip="Do students or parents ask many questions before enrolling?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.inquiryLevel === opt} onClick={() => onChange('inquiryLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Information Clarity */}
                <GameCard>
                    <FieldLabel label="Course Clarity" tooltip="Do students clearly understand your courses/programs?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Vague)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.courseClarity === opt} onClick={() => onChange('courseClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Detail Inquiries" tooltip="Do students ask about pricing, duration, or details frequently?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.pricingInquiry === opt} onClick={() => onChange('pricingInquiry', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Interest Drop-off" tooltip="Do students drop off after showing interest?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dropOffInterest === opt} onClick={() => onChange('dropOffInterest', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Retention */}
                <GameCard>
                    <FieldLabel label="Pre-Enrollment Loss" tooltip="Do you lose students before they enroll?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-20%)', 'High (20%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToEnroll === opt} onClick={() => onChange('lostToEnroll', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Program Completion" tooltip="Do students fail to continue or complete programs?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionIssue === opt} onClick={() => onChange('retentionIssue', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Student Data & Communication */}
                <GameCard>
                    <FieldLabel label="Update Regularity" tooltip="Do you communicate updates (classes, schedules, offers)?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.updatesLevel === opt} onClick={() => onChange('updatesLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Positioning */}
                <GameCard>
                    <FieldLabel label="Perceived Value" tooltip="Do students understand the value of your program?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Fully)', 'Sometimes (Unsure)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valueUnderstanding === opt} onClick={() => onChange('valueUnderstanding', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Promotion Intensity" tooltip="Do you actively promote your programs?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Not at all)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.updatesLevel === opt} onClick={() => onChange('updatesLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Office & Digital Setup */}
                <GameCard>
                    <FieldLabel label="Learning Space" tooltip="Do you have a physical learning space?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Physical)', 'Hybrid (Both)', 'Online (Digital)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.learningSpace === opt} onClick={() => onChange('learningSpace', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-Class Engagement" tooltip="Do students spend time waiting or interacting before classes?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.preClassDwell === opt} onClick={() => onChange('preClassDwell', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Platforms" tooltip="Digital platforms for learning or communication?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Some)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalReadiness === opt} onClick={() => onChange('digitalReadiness', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Technology & Digital Service') {
        return (
            <div className="space-y-6">
                {/* Section 1: Business Basics */}
                <GameCard>
                    <FieldLabel label="Monthly Project Volume" tooltip="How many clients/projects do you handle monthly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-10)', 'Medium (11-40)', 'High (40+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.monthlyProjects === opt} onClick={() => onChange('monthlyProjects', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Client Discovery" tooltip="How do clients usually find you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Referrals', 'Social media', 'Website', 'Freelance platforms'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.acquisitionChannel === opt} onClick={() => onChange('acquisitionChannel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Engagement & Response */}
                <GameCard>
                    <FieldLabel label="Contact Method" tooltip="How do clients request your service?" />
                    <div className="flex flex-wrap gap-2">
                        {['WhatsApp', 'Email', 'Phone call', 'Website form'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.contactMethod === opt} onClick={() => onChange('contactMethod', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" tooltip="How fast do you respond to inquiries?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast (<10m)', 'Medium (10-30m)', 'Slow (30m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseSpeed === opt} onClick={() => onChange('responseSpeed', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Complaints" tooltip="Do clients complain about slow responses?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseComplaints === opt} onClick={() => onChange('responseComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Clarity & Onboarding */}
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do clients clearly understand your services/packages?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Some)', 'No (Confusing)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-Project Questions" tooltip="Do clients ask many questions before starting?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.preprojectQuestions === opt} onClick={() => onChange('preprojectQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Project Delay" tooltip="Do clients delay starting after discussion?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<3 days)', 'Medium (3-7 days)', 'High (7+ days)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.projectDelay === opt} onClick={() => onChange('projectDelay', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales & Project Conversion */}
                <GameCard>
                    <FieldLabel label="Discussion Loss" tooltip="Do you lose clients after initial discussion?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToDiscussion === opt} onClick={() => onChange('lostToDiscussion', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Project Abandonment" tooltip="Do clients abandon projects after starting?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.projectAbandonment === opt} onClick={() => onChange('projectAbandonment', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Client Data & Follow-up */}
                <GameCard>
                    <FieldLabel label="Data Collection" tooltip="Do you collect client contact details properly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regular)', 'Sometimes (Rare)', 'No (Not yet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-up Effort" tooltip="Do you follow up with leads or inactive clients?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Presence */}
                <GameCard>
                    <FieldLabel label="Perceived Value" tooltip="Do clients understand the value of your service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Fully)', 'Sometimes (Unsure)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.perceivedValue === opt} onClick={() => onChange('perceivedValue', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Active Promotion" tooltip="Do you actively promote your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Not at all)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Digital Infrastructure */}
                <GameCard>
                    <FieldLabel label="Online Presence" tooltip="Website/Portfolio strength?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Weak)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.onlinePresence === opt} onClick={() => onChange('onlinePresence', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Onboarding Process" tooltip="Do you have a structured onboarding process?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Structured)', 'Partially (Some)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.onboardingProcess === opt} onClick={() => onChange('onboardingProcess', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Engagement" tooltip="Do clients interact with your brand digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalEngagement === opt} onClick={() => onChange('digitalEngagement', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 8: Problems & Improvement */}
                <GameCard>
                    <FieldLabel label="Biggest Challenges" tooltip="Identify the main bottlenecks or areas slowing down growth." />
                    <div className="flex flex-wrap gap-2">
                        {['Low conversion', 'Poor coordination', 'No customer data', 'Low awareness', 'Weak marketing'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Improvement Need" tooltip="Rate business need for improvement" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Real Estate & Property') {
        return (
            <div className="space-y-6">
                {/* Section 1: Business Basics */}
                <GameCard>
                    <FieldLabel label="Monthly Lead Volume" tooltip="Average number of property inquiries per month" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-20)', 'Medium (21-80)', 'High (80+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.monthlyLeads === opt} onClick={() => onChange('monthlyLeads', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Lead Channels" tooltip="How do clients usually find your properties?" />
                    <div className="flex flex-wrap gap-2">
                        {['Referrals', 'Social media', 'Property platforms', 'Walk-ins'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.clientSource === opt} onClick={() => onChange('clientSource', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Client Engagement */}
                <GameCard>
                    <FieldLabel label="Inquiry Method" tooltip="Primary channel for property inquiries" />
                    <div className="flex flex-wrap gap-2">
                        {['Phone call', 'WhatsApp', 'Website', 'Physical office'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.inquiryMethod === opt} onClick={() => onChange('inquiryMethod', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" tooltip="How fast do you respond to inquiries?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast (<1hr)', 'Medium (Same day)', 'Slow (>1 day)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Complaints" tooltip="Do clients complain about late responses?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.delayedResponseComplaints === opt} onClick={() => onChange('delayedResponseComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Property Visibility */}
                <GameCard>
                    <FieldLabel label="Property Visibility" tooltip="Can clients easily find all available listings?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Vague)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.propertyVisibility === opt} onClick={() => onChange('propertyVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Info Gap" tooltip="Do you get many repetitive questions about listings?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.propertyQuestions === opt} onClick={() => onChange('propertyQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Viewing Delay" tooltip="Do clients delay decisions after site visits?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<48h)', 'Medium (3-7 days)', 'High (7+ days)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.viewingDecisionDelay === opt} onClick={() => onChange('viewingDecisionDelay', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales & Conversion */}
                <GameCard>
                    <FieldLabel label="Conversion Loss" tooltip="Do you lose clients after inspection?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Inspection No-Shows" tooltip="Rate of people missing scheduled inspections" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.noShowInspections === opt} onClick={() => onChange('noShowInspections', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Data & Follow-up */}
                <GameCard>
                    <FieldLabel label="Data Collection" tooltip="Are you collecting lead data properly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-up Effort" tooltip="Are you following up with interested leads?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing */}
                <GameCard>
                    <FieldLabel label="Perceived Value" tooltip="Do clients understand your property value?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valueUnderstanding === opt} onClick={() => onChange('valueUnderstanding', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Active Promotion" tooltip="Do you actively promote your listings?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Setup */}
                <GameCard>
                    <FieldLabel label="Signage Visibility" tooltip="Do you use physical site signage?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Full Access)', 'Limited (Basic)', 'None (Zero)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.physicalBranding === opt} onClick={() => onChange('physicalBranding', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Engagement" tooltip="Do clients interact with your portfolio digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalEngagement === opt} onClick={() => onChange('digitalEngagement', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Listing System" tooltip="Do you have a structured listing system?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 8: Problems & Improvement */}
                <GameCard>
                    <FieldLabel label="Primary Challenges" tooltip="What is your biggest bottleneck?" />
                    <div className="flex flex-wrap gap-2">
                        {['Low conversion', 'Poor follow-up', 'No listings', 'Weak marketing', 'Client drop-off'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Improvement Need" tooltip="Rate business need for improvement" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
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
                    <FieldLabel label="Daily Customer Traffic" tooltip="Average number of customers handled per day" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-20)', 'Medium (21-60)', 'High (60+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dailyCustomers === opt} onClick={() => onChange('dailyCustomers', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Customer Channels" tooltip="How do customers usually find your business?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-ins', 'Referrals', 'Online / Social media', 'Repeat customers'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerSource === opt} onClick={() => onChange('customerSource', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Customer Experience & Waiting */}
                <GameCard>
                    <FieldLabel label="Service Request Method" tooltip="How do customers request your service?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-in only', 'Phone call', 'WhatsApp', 'Booking system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.inquiryMethod === opt} onClick={() => onChange('inquiryMethod', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Waiting Time" tooltip="Average wait before service starts" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0–10m)', 'Medium (11–30m)', 'High (30+m)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingTime === opt} onClick={() => onChange('waitingTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Waiting Complaints" tooltip="Do customers complain about waiting time?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingComplaints === opt} onClick={() => onChange('waitingComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Service Clarity & Process */}
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do customers clearly understand your services/prices?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Clear)', 'Partially (Vague)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-Service Questions" tooltip="Do customers ask many questions before service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.preserviceQuestions === opt} onClick={() => onChange('preserviceQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Hesitation" tooltip="Do customers delay or hesitate before agreeing to service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Some)', 'High (Much)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceHesitation === opt} onClick={() => onChange('serviceHesitation', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales & Customer Loss */}
                <GameCard>
                    <FieldLabel label="Lost to Delay" tooltip="Do you lose customers due to waiting or delays?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToDelay === opt} onClick={() => onChange('lostToDelay', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Issues" tooltip="Do customers fail to return after first service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionRate === opt} onClick={() => onChange('retentionRate', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Customer Data & Follow-Up */}
                <GameCard>
                    <FieldLabel label="Data Collection" tooltip="Do you collect customer contact details?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-Up Effort" tooltip="Do you follow up with customers after service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rare)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Visibility */}
                <GameCard>
                    <FieldLabel label="Service Awareness" tooltip="Do customers know about all your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceAwareness === opt} onClick={() => onChange('serviceAwareness', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Active Promotion" tooltip="Do you promote your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical Setup */}
                <GameCard>
                    <FieldLabel label="Location Signage" tooltip="Do you have visible location or signage?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Bright)', 'Limited (Small)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.hasSignage === opt} onClick={() => onChange('hasSignage', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="On-Site Waiting" tooltip="Do customers spend time waiting on-site?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitingOnsite === opt} onClick={() => onChange('waitingOnsite', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="QR Placement Spots" tooltip="Are there areas to place QR codes?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Many', 'Limited', 'None'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.qrFeasibility === opt} onClick={() => onChange('qrFeasibility', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 8: Problems & Improvement */}
                <GameCard>
                    <FieldLabel label="Primary Challenges" tooltip="What are your biggest pain points?" />
                    <div className="flex flex-wrap gap-2">
                        {['Long waiting time', 'No structured process', 'No customer data', 'Low repeat customers', 'Weak marketing'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Improvement Need" tooltip="Rate business need for improvement" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Logistics & Transportation') {
        return (
            <div className="space-y-6">
                {/* Section 1: Business Basics */}
                <GameCard>
                    <FieldLabel label="Daily Requests" tooltip="How many requests/orders do you handle daily?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0 – 30 per day)', 'Medium (31 – 100 per day)', 'High (100+ per day)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.dailyRequests === opt} onClick={() => onChange('dailyRequests', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Request Channels" tooltip="How do customers usually request your service?" />
                    <div className="flex flex-wrap gap-2">
                        {['Phone calls', 'WhatsApp', 'Walk-ins', 'App/Website'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.requestChannel === opt} onClick={() => onChange('requestChannel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Booking & Response */}
                <GameCard>
                    <FieldLabel label="Booking Management" tooltip="How do you manage bookings or ride/delivery requests?" />
                    <div className="flex flex-wrap gap-2">
                        {['Manual (calls/notes)', 'WhatsApp coordination', 'Basic digital system', 'Structured system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingManagement === opt} onClick={() => onChange('bookingManagement', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" tooltip="How fast do you respond to requests?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast (<10m)', 'Medium (10-30m)', 'Slow (30m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Delay Complaints" tooltip="Do customers complain about delays?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.delayComplaints === opt} onClick={() => onChange('delayComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Service Flow & Tracking */}
                <GameCard>
                    <FieldLabel label="Tracking Capability" tooltip="Can customers track their delivery or trip?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (real-time)', 'Limited', 'No'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.trackingCapability === opt} onClick={() => onChange('trackingCapability', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Update Inquiries" tooltip="Do customers ask for updates frequently?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.updateRequests === opt} onClick={() => onChange('updateRequests', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Operational Delays" tooltip="Do deliveries or trips get delayed often?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.deliveryDelays === opt} onClick={() => onChange('deliveryDelays', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Customer Loss & Efficiency */}
                <GameCard>
                    <FieldLabel label="Loss to Delays" tooltip="Do you lose customers due to delays or poor coordination?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-20%)', 'High (20%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.lostToDelays === opt} onClick={() => onChange('lostToDelays', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Cancellation Rate" tooltip="Do customers fail to complete bookings or cancel frequently?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.cancellationRate === opt} onClick={() => onChange('cancellationRate', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Customer Data & Follow-up */}
                <GameCard>
                    <FieldLabel label="Data Collection" tooltip="Do you collect customer contact details?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Always)', 'Sometimes (Manual)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Post-Service Follow-up" tooltip="Do you follow up with customers after service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Visibility */}
                <GameCard>
                    <FieldLabel label="Service Awareness" tooltip="Do customers understand all your services/routes?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceAwareness === opt} onClick={() => onChange('serviceAwareness', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Active Promotion" tooltip="Do you promote your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical / Digital Setup */}
                <GameCard>
                    <FieldLabel label="Branding Visibility" tooltip="Do you have visible branding on vehicles or offices?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Clear)', 'Medium (Limited)', 'Low (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.brandingVisibility === opt} onClick={() => onChange('brandingVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Interaction" tooltip="Do customers interact with your service digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalEngagement === opt} onClick={() => onChange('digitalEngagement', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness" tooltip="Do you have a digital platform or system for operations?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalOperations === opt} onClick={() => onChange('digitalOperations', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 8: Problems Identification */}
                <GameCard>
                    <FieldLabel label="Primary Challenges" tooltip="What are your biggest challenges?" />
                    <div className="flex flex-wrap gap-2">
                        {['Delivery delays', 'Poor coordination', 'No tracking system', 'Low repeat customers', 'Weak marketing'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 9: Scoring Input */}
                <GameCard>
                    <FieldLabel label="Improvement Urgency" tooltip="Rate business need for improvement" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Construction & Home Services') {
        return (
            <div className="space-y-6">
                {/* Section 1: Business Basics */}
                <GameCard>
                    <FieldLabel label="Monthly Jobs" tooltip="How many jobs/projects do you handle monthly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0 – 10 per month)', 'Medium (11 – 30 per month)', 'High (30+ per month)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.monthlyJobs === opt} onClick={() => onChange('monthlyJobs', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Lead Source" tooltip="How do customers usually find you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Referrals', 'Walk-ins', 'Social media', 'Online search'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.leadSource === opt} onClick={() => onChange('leadSource', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Job Request & Response */}
                <GameCard>
                    <FieldLabel label="Request Channels" tooltip="How do customers request your service?" />
                    <div className="flex flex-wrap gap-2">
                        {['Phone call', 'WhatsApp', 'Physical visit', 'Structured booking system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.requestChannel === opt} onClick={() => onChange('requestChannel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" tooltip="How fast do you respond to inquiries?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast (within 1 hour)', 'Medium (same day)', 'Slow (next day or more)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Slow Response Complaints" tooltip="Do customers complain about slow response?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.slowResponseComplaints === opt} onClick={() => onChange('slowResponseComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Quotation & Service Clarity */}
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do customers clearly understand your services and pricing?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Very clear)', 'Partially (Vague)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-job Inquiries" tooltip="Do customers ask many questions before agreeing to a job?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.preJobInquiries === opt} onClick={() => onChange('preJobInquiries', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Quote Delay" tooltip="Do customers delay approval after receiving a quote?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<2 days)', 'Medium (2-5 days)', 'High (5+ days)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.quoteDelay === opt} onClick={() => onChange('quoteDelay', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Conversion & Job Loss */}
                <GameCard>
                    <FieldLabel label="Conversion Loss" tooltip="Do you lose jobs after giving a quote?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Job Cancellations" tooltip="Do customers cancel jobs after booking?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.jobCancellations === opt} onClick={() => onChange('jobCancellations', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Customer Data & Follow-up */}
                <GameCard>
                    <FieldLabel label="Data Collection" tooltip="Do you collect customer contact details properly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Always)', 'Sometimes (Manual)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Post-Service Follow-up" tooltip="Do you follow up with customers after service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Visibility */}
                <GameCard>
                    <FieldLabel label="Value Perception" tooltip="Do customers understand the value of your service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valuePerception === opt} onClick={() => onChange('valuePerception', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Active Promotion" tooltip="Do you actively promote your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical / Digital Setup */}
                <GameCard>
                    <FieldLabel label="Branding Visibility" tooltip="Do you have visible branding or signage?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Strong)', 'Medium (Limited)', 'Low (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.brandingVisibility === opt} onClick={() => onChange('brandingVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Interaction" tooltip="Do customers interact with your services digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalInteraction === opt} onClick={() => onChange('digitalInteraction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness (Portfolio)" tooltip="Do you have a digital platform or portfolio?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPresence === opt} onClick={() => onChange('digitalPresence', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 8: Problems Identification */}
                <GameCard>
                    <FieldLabel label="Primary Challenges" tooltip="What are your biggest challenges?" />
                    <div className="flex flex-wrap gap-2">
                        {['Low conversion rate', 'Slow response', 'No structured booking', 'Poor follow-up', 'Weak marketing'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 9: Scoring Input */}
                <GameCard>
                    <FieldLabel label="Improvement Urgency" tooltip="Rate business need for improvement" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Event & Entertainment') {
        return (
            <div className="space-y-6">
                {/* Section 1: Business Basics */}
                <GameCard>
                    <FieldLabel label="Monthly Events" tooltip="How many events/jobs do you handle monthly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0 – 8 per month)', 'Medium (9 – 25 per month)', 'High (25+ per month)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.monthlyEvents === opt} onClick={() => onChange('monthlyEvents', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Discovery Channel" tooltip="How do clients usually find you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Referrals', 'Social media', 'Event platforms', 'Walk-ins'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.discoveryChannel === opt} onClick={() => onChange('discoveryChannel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Inquiry & Booking */}
                <GameCard>
                    <FieldLabel label="Booking Channel" tooltip="How do clients inquire or book your service?" />
                    <div className="flex flex-wrap gap-2">
                        {['Phone call', 'WhatsApp', 'Social media DM', 'Structured booking system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingChannel === opt} onClick={() => onChange('bookingChannel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Speed" tooltip="How fast do you respond to inquiries?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Fast (within 1 hour)', 'Medium (same day)', 'Slow (next day or more)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseTime === opt} onClick={() => onChange('responseTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Slow Response Complaints" tooltip="Do clients complain about slow responses?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.slowResponseComplaints === opt} onClick={() => onChange('slowResponseComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Service Visibility & Portfolio */}
                <GameCard>
                    <FieldLabel label="Portfolio Visibility" tooltip="Do clients clearly see your past work or services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Very clear)', 'Partially (Some)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.portfolioVisibility === opt} onClick={() => onChange('portfolioVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Service Inquiries" tooltip="Do clients ask many questions about your services or pricing?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceInquiries === opt} onClick={() => onChange('serviceInquiries', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Decision Delay" tooltip="Do clients delay decision after initial discussion?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<3 days)', 'Medium (3-7 days)', 'High (7+ days)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.decisionDelay === opt} onClick={() => onChange('decisionDelay', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Bookings & Client Loss */}
                <GameCard>
                    <FieldLabel label="Conversion Loss" tooltip="Do you lose clients after inquiry or quotation?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Booking Cancellations" tooltip="Do clients cancel bookings after confirming?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.bookingCancellations === opt} onClick={() => onChange('bookingCancellations', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Client Data & Follow-up */}
                <GameCard>
                    <FieldLabel label="Client Data Collection" tooltip="Do you collect client contact details properly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Always)', 'Sometimes (Manual)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-up Effort" tooltip="Do you follow up with clients after events or inquiries?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Promotion */}
                <GameCard>
                    <FieldLabel label="Value Perception" tooltip="Do clients understand the value of your service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valuePerception === opt} onClick={() => onChange('valuePerception', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Active Promotion" tooltip="Do you actively promote your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical / Digital Setup */}
                <GameCard>
                    <FieldLabel label="Physical Setup" tooltip="Do you have a showroom, office, or display setup?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.physicalSetup === opt} onClick={() => onChange('physicalSetup', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Interaction" tooltip="Do clients interact with your work digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalInteraction === opt} onClick={() => onChange('digitalInteraction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness (Portfolio)" tooltip="Do you have a strong portfolio or digital presence?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPresence === opt} onClick={() => onChange('digitalPresence', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 8: Problems Identification */}
                <GameCard>
                    <FieldLabel label="Primary Challenges" tooltip="What are your biggest challenges?" />
                    <div className="flex flex-wrap gap-2">
                        {['Low bookings', 'Poor visibility', 'No structured booking', 'Client cancellations', 'Weak marketing'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 9: Scoring Input */}
                <GameCard>
                    <FieldLabel label="Improvement Urgency" tooltip="Rate business need for improvement" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Finance & Financial Services') {
        return (
            <div className="space-y-6">
                {/* Section 1: Business Basics */}
                <GameCard>
                    <FieldLabel label="Customer Volume" tooltip="How many customers do you handle daily/weekly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0 – 30 per day/week)', 'Medium (31 – 100 per day/week)', 'High (100+ per day/week)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerVolume === opt} onClick={() => onChange('customerVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Acquisition Channel" tooltip="How do customers usually come to you?" />
                    <div className="flex flex-wrap gap-2">
                        {['Walk-ins', 'Referrals', 'Agents', 'Digital channels'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.acquisitionChannel === opt} onClick={() => onChange('acquisitionChannel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Customer Experience & Response */}
                <GameCard>
                    <FieldLabel label="Service Access Channels" tooltip="How do customers access your services?" />
                    <div className="flex flex-wrap gap-2">
                        {['Physical branch', 'Agent network', 'Mobile app / website', 'Mixed channels'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceChannel === opt} onClick={() => onChange('serviceChannel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait Time" tooltip="Do customers wait before being attended to?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0–10 minutes)', 'Medium (11–30 minutes)', 'High (30+ minutes)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.waitTime === opt} onClick={() => onChange('waitTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Wait/Delay Complaints" tooltip="Do customers complain about waiting or service delays?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.delayComplaints === opt} onClick={() => onChange('delayComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Service Clarity & Trust */}
                <GameCard>
                    <FieldLabel label="Service Clarity" tooltip="Do customers clearly understand your services/products?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Very clear)', 'Partially (Vague)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-Service Questions" tooltip="Do customers ask many questions before using your service?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.preServiceQuestions === opt} onClick={() => onChange('preServiceQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Transaction Hesitation" tooltip="Do customers hesitate before completing transactions?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.transactionHesitation === opt} onClick={() => onChange('transactionHesitation', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Transaction & Customer Loss */}
                <GameCard>
                    <FieldLabel label="Transaction Drop-off" tooltip="Do you lose customers before completing transactions?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<5%)', 'Medium (5-15%)', 'High (15%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.transactionDropoff === opt} onClick={() => onChange('transactionDropoff', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Issues" tooltip="Do customers fail to return after first transaction?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionIssue === opt} onClick={() => onChange('retentionIssue', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Customer Data & Communication */}
                <GameCard>
                    <FieldLabel label="Data Collection" tooltip="Do you collect customer contact details?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Always)', 'Sometimes (Manual)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Engagement Effort" tooltip="Do you communicate updates, offers, or reminders?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.engagementLevel === opt} onClick={() => onChange('engagementLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing & Education */}
                <GameCard>
                    <FieldLabel label="Value Perception" tooltip="Do customers understand the value of your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Sometimes (Rarely)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valuePerception === opt} onClick={() => onChange('valuePerception', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Customer Education" tooltip="Do you educate customers about your services?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Never)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerEducation === opt} onClick={() => onChange('customerEducation', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Physical / Digital Setup */}
                <GameCard>
                    <FieldLabel label="Branch Branding" tooltip="Do you have visible branding or branch presence?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.branchBranding === opt} onClick={() => onChange('branchBranding', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Interaction" tooltip="Do customers interact with your services digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalInteraction === opt} onClick={() => onChange('digitalInteraction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness" tooltip="Do you have a digital platform (app, website, dashboard)?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 8: Problems Identification */}
                <GameCard>
                    <FieldLabel label="Biggest Challenges" />
                    <div className="flex flex-wrap gap-2">
                        {['Low customer trust', 'Slow service', 'Poor communication', 'Low retention', 'Weak awareness'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 9: Scoring Input */}
                <GameCard>
                    <FieldLabel label="Improvement Urgency" tooltip="How critical is it to transform this area of the business?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
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
                    <FieldLabel label="Production/Sales Volume" tooltip="Measures scale of operation." />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Small-scale production/sales)', 'Medium (Moderate production/sales)', 'High (Large-scale production/sales)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.salesVolume === opt} onClick={() => onChange('salesVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Sales Channels" tooltip="How do customers find you?" />
                    <div className="grid grid-cols-2 gap-2">
                        {['Local market', 'Middlemen/agents', 'Direct buyers', 'Online channels'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.acquisitionChannel === opt} onClick={() => onChange('acquisitionChannel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Sales & Order Process */}
                <GameCard>
                    <FieldLabel label="Ordering Method" tooltip="How do buyers place orders?" />
                    <div className="grid grid-cols-2 gap-2">
                        {['Physical visit', 'Phone call', 'WhatsApp', 'Structured order system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.orderMethod === opt} onClick={() => onChange('orderMethod', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Ordering Friction" tooltip="Do buyers struggle to place orders?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Smooth)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.orderFriction === opt} onClick={() => onChange('orderFriction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Communication Complaints" tooltip="Do buyers complain about response?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.commComplaints === opt} onClick={() => onChange('commComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Product Visibility */}
                <GameCard>
                    <FieldLabel label="Product Visibility" tooltip="Can buyers clearly see available produce?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Very clear)', 'Partially (Vague)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.productVisibility === opt} onClick={() => onChange('productVisibility', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Availability Inquiries" tooltip="Do buyers ask many pricing/availability questions?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.availabilityQuestions === opt} onClick={() => onChange('availabilityQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Purchase Delay" tooltip="Do buyers delay purchase after inquiry?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<24h)', 'Medium (1-3 days)', 'High (3+ days)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.purchaseDelay === opt} onClick={() => onChange('purchaseDelay', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales Loss & Retention */}
                <GameCard>
                    <FieldLabel label="Inquiry Loss" tooltip="Do you lose buyers after inquiry?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.inquiryLoss === opt} onClick={() => onChange('inquiryLoss', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Retention Issues" tooltip="Do buyers fail to return?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.retentionProblem === opt} onClick={() => onChange('retentionProblem', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Customer Data */}
                <GameCard>
                    <FieldLabel label="Collects Data" tooltip="Do you collect buyer contact details?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Always)', 'Sometimes (Some)', 'No (Not yet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-up Level" tooltip="Do you follow up after sales?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regular)', 'Sometimes (Rare)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpLevel === opt} onClick={() => onChange('followUpLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing */}
                <GameCard>
                    <FieldLabel label="Value Perception" tooltip="Do buyers understand your product value?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Fully)', 'Sometimes (Unsure)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valuePerception === opt} onClick={() => onChange('valuePerception', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Marketing Effort" tooltip="Do you actively promote products?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Not at all)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.marketingEffort === opt} onClick={() => onChange('marketingEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Digital Setup */}
                <GameCard>
                    <FieldLabel label="Primary Channel" tooltip="Do you sell mainly offline or online?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Offline only', 'Hybrid', 'Online'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.salesChannel === opt} onClick={() => onChange('salesChannel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Interaction" tooltip="Do buyers interact digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalInteraction === opt} onClick={() => onChange('digitalInteraction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness" tooltip="Do you have a digital platform/catalog?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Biggest Challenges" tooltip="Identify the main bottlenecks or areas slowing down growth." />
                    <div className="flex flex-wrap gap-2">
                        {['Low sales', 'Poor market access', 'No structured orders', 'Low repeat buyers', 'Weak marketing'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Improvement Urgency" tooltip="How critical is it to transform this area of the business?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }


    if (type === 'Government & Public Services') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Citizen Volume" tooltip="Estimated number of citizens served daily." />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-20/day)', 'Medium (21-100/day)', 'High (100+/day)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.citizenVolume === opt} onClick={() => onChange('citizenVolume', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Queue Time" tooltip="Wait time before being attended?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0-15m)', 'Medium (15-45m)', 'High (45m+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.queueTime === opt} onClick={() => onChange('queueTime', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Procedure Clarity" tooltip="Do citizens understand requirements?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Very clear)', 'Partially (Some)', 'No (Confusing)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.procedureClarity === opt} onClick={() => onChange('procedureClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Unprepared Citizens" tooltip="Come with wrong/missing documents?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.unpreparedCitizens === opt} onClick={() => onChange('unpreparedCitizens', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Multiple Returns?" tooltip="Return multiple times for one task?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Sometimes)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.multipleReturns === opt} onClick={() => onChange('multipleReturns', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Platform Status" tooltip="Existing digital infrastructure for service delivery." />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>
            </div>
        );
    }

    if (type === 'Religious & Non-Profit Organizations' || type === 'Religion & NGO') {
        return (
            <div className="space-y-6">
                <GameCard>
                    <FieldLabel label="Member/Participant Count" tooltip="Measures size of the organization." />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0 – 100 members)', 'Medium (101 – 500 members)', 'High (500+ members)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.memberCount === opt} onClick={() => onChange('memberCount', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Growth Channels" tooltip="How do people usually join or find you?" />
                    <div className="grid grid-cols-2 gap-2">
                        {['Referrals', 'Social media', 'Physical visits', 'Outreach programs'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.acquisitionChannel === opt} onClick={() => onChange('acquisitionChannel', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Information Channel" tooltip="How do members receive updates?" />
                    <div className="grid grid-cols-2 gap-2">
                        {['Announcements (physical)', 'WhatsApp groups', 'SMS', 'Structured system'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.infoMethod === opt} onClick={() => onChange('infoMethod', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Missed Updates" tooltip="Do members miss important info?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.missedUpdates === opt} onClick={() => onChange('missedUpdates', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Information Complaints" tooltip="Do members complain about lack of info?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.infoComplaints === opt} onClick={() => onChange('infoComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Program Awareness" tooltip="Do members clearly know your programs?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Very clear)', 'Partially (Some)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.programAwareness === opt} onClick={() => onChange('programAwareness', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Program Inquiries" tooltip="Do members ask many questions about events?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.programInquiries === opt} onClick={() => onChange('programInquiries', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Attendance Drop-off" tooltip="Do members fail to attend after showing interest?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-25%)', 'High (25%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.attendanceDropoff === opt} onClick={() => onChange('attendanceDropoff', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Donation Struggle" tooltip="Do you struggle with collecting donations?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.donationStruggle === opt} onClick={() => onChange('donationStruggle', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Donation Regularity" tooltip="Do donors fail to contribute regularly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10% fail)', 'Medium (10-25% fail)', 'High (25%+ fail)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.donationRegularity === opt} onClick={() => onChange('donationRegularity', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Member Data Collection" tooltip="Do you collect member/donor details properly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Always)', 'Sometimes (Manual)', 'No (Not yet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.memberData === opt} onClick={() => onChange('memberData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-up Level" tooltip="Do you follow up with members/donors?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rare)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpLevel === opt} onClick={() => onChange('followUpLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Mission Understanding" tooltip="Do people understand your mission/impact?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Fully)', 'Sometimes (Unsure)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.missionUnderstanding === opt} onClick={() => onChange('missionUnderstanding', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Promotion Effort" tooltip="Do you actively promote your programs?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Not at all)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.promotionEffort === opt} onClick={() => onChange('promotionEffort', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Physical Facility" tooltip="Do you have a physical place for gatherings?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Active)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.gatheringPlace === opt} onClick={() => onChange('gatheringPlace', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Interaction" tooltip="Do members interact digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalInteraction === opt} onClick={() => onChange('digitalInteraction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness" tooltip="Do you have a digital platform/system?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalPlatform === opt} onClick={() => onChange('digitalPlatform', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Biggest Challenges" tooltip="Identify the main bottlenecks or areas slowing down growth." />
                    <div className="flex flex-wrap gap-2">
                        {['Poor communication', 'Low participation', 'Low donations', 'No structured system', 'Weak awareness'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Improvement Urgency" tooltip="How critical is it to transform this area of the business?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
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
                    <FieldLabel label="Closest Category" tooltip="Map your business to an existing structure" />
                    <div className="flex flex-wrap gap-2">
                        {['Retail', 'Service-based', 'Production/Manufacturing', 'Digital/Online', 'Mixed'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.closestCategory === opt} onClick={() => onChange('closestCategory', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Customer Volume" tooltip="How many customers do you handle regularly?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (0 – 20)', 'Medium (21 – 100)', 'High (100+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerVolume === opt} onClick={() => onChange('customerVolume', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 2: Customer Interaction */}
                <GameCard>
                    <FieldLabel label="Acquisition Channels" tooltip="How do customers reach you?" />
                    <div className="grid grid-cols-2 gap-2">
                        {['Phone', 'WhatsApp', 'Physical visit', 'Social media'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.acquisitionChannel === opt} onClick={() => onChange('acquisitionChannel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Interaction Delays" tooltip="Do customers experience issues when reaching you?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Fast)', 'Medium (Some delay)', 'High (Long delay)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.interactionDelays === opt} onClick={() => onChange('interactionDelays', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Response Complaints" tooltip="Do customers complain about your response time?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rare)', 'Medium (Occasional)', 'High (Frequent)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.responseComplaints === opt} onClick={() => onChange('responseComplaints', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 3: Delivery & Clarity */}
                <GameCard>
                    <FieldLabel label="Offering Clarity" tooltip="Do customers clearly understand your offerings?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Very clear)', 'Partially (Vague)', 'No (Hidden)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.offeringClarity === opt} onClick={() => onChange('offeringClarity', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Pre-buying Questions" tooltip="Do customers ask many questions before buying?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Rarely)', 'Medium (Sometimes)', 'High (Frequently)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.preBuyingQuestions === opt} onClick={() => onChange('preBuyingQuestions', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Interest Delay" tooltip="Do customers delay after showing interest?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<48h)', 'Medium (3-7 days)', 'High (7+ days)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.interestDelay === opt} onClick={() => onChange('interestDelay', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 4: Sales & Retention */}
                <GameCard>
                    <FieldLabel label="Contact Drop-off" tooltip="Do you lose customers after initial contact?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (<10%)', 'Medium (10-30%)', 'High (30%+)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.contactDropoff === opt} onClick={() => onChange('contactDropoff', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Customer Retention" tooltip="Do customers come back again?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (70%+)', 'Medium (40-70%)', 'Low (<40%)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.customerRetention === opt} onClick={() => onChange('customerRetention', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 5: Data & Follow-up */}
                <GameCard>
                    <FieldLabel label="Collects Data" tooltip="Do you collect customer details?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Always)', 'Sometimes (Manual)', 'No (Not yet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Follow-up Level" tooltip="Do you regularly follow up with customers?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rare)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.followUpLevel === opt} onClick={() => onChange('followUpLevel', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 6: Marketing */}
                <GameCard>
                    <FieldLabel label="Value Understanding" tooltip="Do people understand the value of your business?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Fully)', 'Sometimes (Unsure)', 'No (Confusion)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.valueUnderstanding === opt} onClick={() => onChange('valueUnderstanding', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Active Promotion" tooltip="Do you actively promote your business?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Regularly)', 'Sometimes (Rarely)', 'No (Not at all)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                        ))}
                    </div>
                </GameCard>

                {/* Section 7: Setup */}
                <GameCard>
                    <FieldLabel label="Operating Model" tooltip="Do you operate physically, digitally, or both?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Physical only', 'Digital only', 'Hybrid'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.operatingModel === opt} onClick={() => onChange('operatingModel', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Interaction" tooltip="Do customers interact with you digitally?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['High (Active)', 'Medium (Sometimes)', 'Low (Quiet)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalInteraction === opt} onClick={() => onChange('digitalInteraction', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Digital Readiness" tooltip="Do you have any digital tools or platform?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Yes (Strong)', 'Limited (Basic)', 'No (None)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.digitalReadiness === opt} onClick={() => onChange('digitalReadiness', opt)} />
                        ))}
                    </div>
                </GameCard>

                <GameCard>
                    <FieldLabel label="Biggest Challenges" tooltip="Identify the main bottlenecks or areas slowing down growth." />
                    <div className="flex flex-wrap gap-2">
                        {['Low sales', 'Poor communication', 'No structure', 'Low repeat customers', 'Weak marketing'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                        ))}
                    </div>
                </GameCard>
                <GameCard>
                    <FieldLabel label="Improvement Urgency" tooltip="How critical is it to transform this area of the business?" />
                    <div className="grid grid-cols-3 gap-2">
                        {['Low (Stable)', 'Medium (Growing)', 'High (Critical)'].map(opt => (
                            <ChoicePill key={opt} label={opt} selected={responses.improvementNeed === opt} onClick={() => onChange('improvementNeed', opt)} />
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

const CATEGORY_STRATEGY_DATA: Record<string, {
    qrPlacements: string[],
    scenarios: string[],
    painPoints: string[],
    demoItems: string[]
}> = {
    'Retail & Shops': {
        qrPlacements: ['Checkout Counter', 'Window Decal', 'Shelf Tags', 'Shopping Bags'],
        scenarios: ['Scan for discounts', 'Follow on socials', 'Product reviews'],
        painPoints: ['Low repeat buyers', 'No customer data', 'Out of stock loss', 'Weak engagement'],
        demoItems: ['Digital Catalog', 'Loyalty Points Flow', 'Feedback Form']
    },
    'Food & Hospitality': {
        qrPlacements: ['Table Stands', 'Menu Board', 'Reception Desk', 'Takeaway Bags'],
        scenarios: ['Scan for digital menu', 'Order from table', 'Leave a review'],
        painPoints: ['Long wait times', 'Menu updates cost', 'Poor order tracking', 'No loyalty'],
        demoItems: ['Scan-to-Order Flow', 'Feedback Form', 'Digital Menu']
    },
    'Beauty & Personal Care': {
        qrPlacements: ['Waiting Area Mirror', 'Reception Desk', 'Window Decal', 'Stylist Station'],
        scenarios: ['Book next appointment', 'View price list', 'Follow on Instagram'],
        painPoints: ['No-shows', 'Empty slots', 'No customer retention', 'Booking chaos'],
        demoItems: ['Booking Flow', 'Loyalty Program', 'Digital Price List']
    },
    'Health & Medical': {
        qrPlacements: ['Reception Desk', 'Waiting Area Poster', 'Appointment Cards', 'Entrance Door'],
        scenarios: ['Book follow-up', 'Fill patient details', 'View health tips'],
        painPoints: ['Long queue times', 'Patient confusion', 'Missed follow-ups', 'Manual records'],
        demoItems: ['Registration Form', 'Booking Flow', 'Patient Feedback']
    },
    'Professional Services': {
        qrPlacements: ['Reception Desk', 'Business Cards', 'Waiting Area', 'Meeting Room'],
        scenarios: ['Schedule consultation', 'View portfolio', 'Leave feedback'],
        painPoints: ['Slow response time', 'Lead drop-off', 'No referral tracking'],
        demoItems: ['Booking Flow', 'Digital Business Card', 'Lead Capture Form']
    },
    'Logistics & Transportation': {
        qrPlacements: ['Vehicle Stickers', 'Package Inserts', 'Ticket Counter', 'Waiting Lounge'],
        scenarios: ['Track package', 'Book a ride/ticket', 'Leave feedback'],
        painPoints: ['Manual tracking', 'Customer inquiries', 'No direct booking', 'Lost packages'],
        demoItems: ['Tracking Interface', 'Booking Flow', 'Feedback Form']
    },
    'Event & Entertainment': {
        qrPlacements: ['Tickets/Badges', 'Event Rollups', 'Entrance Banners', 'Tables'],
        scenarios: ['Event registration', 'View schedule', 'Live feedback'],
        painPoints: ['Slow check-in', 'No attendee data', 'Poor engagement', 'Low feedback'],
        demoItems: ['Event Registration Form', 'Digital Schedule', 'Feedback Form']
    },
    'Education & Training': {
        qrPlacements: ['Notice Board', 'Application Forms', 'Reception', 'Classroom Tables'],
        scenarios: ['Apply for course', 'View curriculum', 'Join community'],
        painPoints: ['Poor inquiry follow-up', 'Manual registration', 'Communication gaps'],
        demoItems: ['Registration Form', 'Course Catalog', 'Feedback Form']
    },
    'Agriculture & Farming': {
        qrPlacements: ['Product Packaging', 'Farm Entrance', 'Delivery Vans', 'Market Stand'],
        scenarios: ['View farm process', 'Place bulk order', 'Contact sales'],
        painPoints: ['Poor market access', 'No direct orders', 'Low trust'],
        demoItems: ['Order Form', 'Digital Catalog', 'Contact Card']
    },
    'Government & Public Services': {
        qrPlacements: ['Information Desk', 'Waiting Area Posters', 'Service Counters', 'Entrance'],
        scenarios: ['View requirements', 'Book queue ticket', 'Give feedback'],
        painPoints: ['Long queues', 'Confusion on process', 'Missing documents', 'Poor data'],
        demoItems: ['Information Portal', 'Queue Booking', 'Feedback Form']
    },
    'Religion & NGO': {
        qrPlacements: ['Offering/Donation Envelopes', 'Entrance Banner', 'Programs/Flyers', 'Seat Backs'],
        scenarios: ['Make donation', 'Register for event', 'Join small group'],
        painPoints: ['Low donations', 'Poor event turnout', 'Lost members', 'No data'],
        demoItems: ['Donation Link', 'Event Registration', 'Feedback Form']
    },
    'Technology & Digital Service': {
        qrPlacements: ['Website / Pitch Deck', 'Digital Invoices', 'Social Media Bios', 'Business Cards'],
        scenarios: ['Book discovery call', 'View portfolio', 'Submit requirement'],
        painPoints: ['Lead drop-off', 'Slow onboarding', 'No feedback loop'],
        demoItems: ['Lead Capture', 'Digital Business Card', 'Feedback Form']
    },
    'Real Estate & Property': {
        qrPlacements: ['Property Signboards', 'Flyers', 'Office Reception', 'Open House Handouts'],
        scenarios: ['View property details', 'Book viewing', 'Contact agent'],
        painPoints: ['Slow lead response', 'No property tracking', 'Low trust'],
        demoItems: ['Digital Catalog', 'Viewing Booking Form', 'Lead Capture']
    },
    'Automotive': {
        qrPlacements: ['Waiting Lounge', 'Service Center Desk', 'Vehicle Tags', 'Invoices'],
        scenarios: ['Book next service', 'View car inventory', 'Leave review'],
        painPoints: ['Missed service reminders', 'No inventory visibility', 'Slow booking'],
        demoItems: ['Service Booking', 'Digital Inventory', 'Loyalty Program']
    },
    'Construction & Home Services': {
        qrPlacements: ['Project Site Boards', 'Flyers', 'Vehicles', 'Invoices'],
        scenarios: ['Request a quote', 'View past work', 'Leave review'],
        painPoints: ['Manual quoting', 'Poor lead capture', 'No referral tracking'],
        demoItems: ['Quote Request Form', 'Digital Portfolio', 'Lead Capture']
    },
    'Finance & Financial Services': {
        qrPlacements: ['Banking Halls', 'Teller Counters', 'Flyers', 'Agent Stands (POS)'],
        scenarios: ['Open account', 'Submit loan request', 'Customer feedback'],
        painPoints: ['Long teller lines', 'Manual forms', 'Poor feedback loop'],
        demoItems: ['Account Opening Form', 'Lead Capture', 'Feedback Form']
    },
    'Other': {
        qrPlacements: ['Reception Area', 'Product Packaging', 'Flyers', 'Storefront Window'],
        scenarios: ['Learn more', 'Leave feedback', 'Contact us'],
        painPoints: ['No customer data', 'Poor engagement', 'Low repeat business', 'Manual operations'],
        demoItems: ['Digital Catalog', 'Lead Capture Form', 'Feedback Form']
    }
};

const getStrategyData = (type: string) => CATEGORY_STRATEGY_DATA[type] || CATEGORY_STRATEGY_DATA['Other'];

const PaginatedCategoryQuestions = ({ type, responses, onChange, localStep }: any) => {
    const React = require('react');
    const content = CategorySpecificQuestions({ type, responses, onChange });
    if (!content) return null;
    
    // Validate that we have a standard structure
    let children = [];
    if (content.props && content.props.children) {
        children = React.Children.toArray(content.props.children).filter((c: any) => React.isValidElement(c));
    }
    
    const totalCards = children.length;
    const cardsPerStep = Math.ceil(totalCards / 5) || 1;
    const startIndex = localStep * cardsPerStep;
    const endIndex = startIndex + cardsPerStep;
    
    const slice = children.slice(startIndex, endIndex);
    if(slice.length === 0) {
        return (
            <div className="space-y-6">
                <GameCard>
                    <div className="text-center p-8 space-y-4">
                        <span className="text-4xl text-emerald-500">✨</span>
                        <h3 className="text-xl font-black">All Done With Specifics!</h3>
                        <p className="text-gray-500 text-sm">You have answered all the targeted questions. Click continue to proceed to strategy.</p>
                    </div>
                </GameCard>
            </div>
        )
    }
    return <div className="space-y-6">{slice}</div>;
};

export default function GamifiedNewProfile({ onSave, isSaving }: { onSave: (data: BusinessProfileFormData) => void, isSaving?: boolean }) {
    const [step, setStep] = useState(1);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [showAchievement, setShowAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
    const [highestStep, setHighestStep] = useState(1);

    const [formData, setFormData] = useState<BusinessProfileFormData>({
        businessName: '', location: '', contactPerson: '', contactEmail: '', contactPhone: '', numberOfBranches: '1',
        businessType: 'Retail & Shops', customerTraffic: 'Medium',
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
        if (!formData.businessType) { notify.error('Please select a business type'); return false; }
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
                        <div className="space-y-6">
                            <GameCard>
                                <FieldLabel label="Business Type" emoji="🏢" tooltip="What kind of hustle is this?" />
                                <GameSelect value={formData.businessType} onChange={(e: any) => setFormData({ ...formData, businessType: e.target.value })}>
                                    {BUSINESS_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                                </GameSelect>
                            </GameCard>
                            <ServiceTypeSelector 
                                type={formData.businessType} 
                                responses={formData.responses} 
                                onChange={handleResponseChange} 
                            />
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

                    
                    {/* ── STEP 3-7: Partitioned Category Specifics ── */}
                    {step >= 3 && step <= 7 && (
                        <PaginatedCategoryQuestions 
                            type={formData.businessType} 
                            responses={formData.responses} 
                            onChange={handleResponseChange} 
                            localStep={step - 3} 
                        />
                    )}

                    {/* ── STEP 8: Custom QR Strategy ── */}
                    {step === 8 && (() => {
                        const sData = getStrategyData(formData.businessType);
                        return (
                            <div className="space-y-5">
                                <GameCard>
                                    <FieldLabel label="Strategic Placements" emoji="🗺️" tooltip="Where is the best place to put QR/NFC to catch this business's target audience?" />
                                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                        {sData.qrPlacements.map((place) => (
                                            <ChoicePill key={place} label={place} selected={formData.indoorPlacement.includes(place)} onClick={() => handleCheckboxChange('indoorPlacement', place)} />
                                        ))}
                                    </div>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Primary Customer Action" emoji="🎭" tooltip="What do we want the customer to do when they scan?" />
                                    <div className="space-y-3">
                                        {sData.scenarios.map((scenario) => (
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
                        );
                    })()}

                    {/* ── STEP 9: Custom Sales Plan ── */}
                    {step === 9 && (() => {
                        const sData = getStrategyData(formData.businessType);
                        return (
                            <div className="space-y-5">
                                <GameCard>
                                    <FieldLabel label="Recommended Package" emoji="📦" tooltip="Which tier fits them best?" />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[{n:'Silver',e:'🥈'},{n:'Gold',e:'🥇'},{n:'Platinum',e:'💎'},{n:'Enterprise',e:'👑'}].map(({n,e}) => (
                                            <ChoicePill key={n} label={`${e} ${n}`} selected={formData.suggestedPackage === n} onClick={() => setFormData({ ...formData, suggestedPackage: n as any })} />
                                        ))}
                                    </div>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Targeting Pain Points" emoji="🩹" tooltip="What specific problems can Vemtap solve for them?" />
                                    <div className="flex flex-wrap gap-3">
                                        {sData.painPoints.map((prob) => (
                                            <ChoicePill key={prob} label={prob} selected={formData.problemsNoticed.includes(prob)} onClick={() => handleCheckboxChange('problemsNoticed', prob)} />
                                        ))}
                                    </div>
                                </GameCard>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <GameCard>
                                        <FieldLabel label="Target Stakeholder" emoji="🎯" tooltip="Who's the decision maker?" />
                                        <div className="space-y-2">
                                            {['Owner', 'Manager', 'Dept Head'].map((p) => (
                                                <ChoicePill key={p} label={p} selected={formData.whoToSpeakTo === p} onClick={() => setFormData({ ...formData, whoToSpeakTo: p as any })} />
                                            ))}
                                        </div>
                                    </GameCard>
                                    <GameCard>
                                        <FieldLabel label="Pitch Style" emoji="🎤" tooltip="How should we approach them?" />
                                        <GameSelect value={formData.approachStyle} onChange={(e: any) => setFormData({ ...formData, approachStyle: e.target.value })}>
                                            <option>Problem-Solving (Pain first)</option><option>Demo-First (Show, don't tell)</option><option>Financial (ROI first)</option><option>Relationship (Trust first)</option>
                                        </GameSelect>
                                    </GameCard>
                                </div>
                                <GameCard>
                                    <FieldLabel label="Demo Toolkit" emoji="🧰" tooltip="What modules to show off!" />
                                    <div className="flex flex-wrap gap-2">
                                        {sData.demoItems.map((item) => (
                                            <ChoicePill key={item} label={item} selected={formData.demoItems.includes(item)} onClick={() => handleCheckboxChange('demoItems', item)} />
                                        ))}
                                    </div>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Custom Pitch Hook" emoji="🪝" tooltip="A personalized 1-liner to hook their attention." />
                                    <GameTextarea placeholder="e.g. 'I noticed your customers wait 20 minutes...'" value={formData.customPitch} onChange={(e: any) => setFormData({ ...formData, customPitch: e.target.value })} rows={3} />
                                </GameCard>
                            </div>
                        );
                    })()}


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
