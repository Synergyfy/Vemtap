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

const GameTextarea = ({ placeholder, value, onChange, rows = 3 }: any) => (
    <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all duration-200 hover:border-gray-200 resize-none"
    />
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
                <div className="space-y-6">
                    <GameCard>
                        <FieldLabel label="Retail Type" emoji="🛍️" />
                        <GameSelect value={responses.retailType || 'Clothing / Fashion'} onChange={(e: any) => onChange('retailType', e.target.value)}>
                            <option>Clothing / Fashion</option><option>Electronics</option><option>Supermarket / Grocery</option>
                            <option>Cosmetics / Beauty</option><option>Home / Furniture</option><option>Mixed Store</option><option>Other</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Easy', 'Medium', 'Hard'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.productDiscovery === opt} onClick={() => onChange('productDiscovery', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Pre-Sale Questions" tooltip="Do customers ask many questions before buying?" />
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.outOfStockLoss === opt} onClick={() => onChange('outOfStockLoss', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Purchase Abandonment" tooltip="Do customers abandon purchase before paying?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.purchaseAbandonment === opt} onClick={() => onChange('purchaseAbandonment', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Visibility */}
                    <GameCard>
                        <FieldLabel label="Product Knowledge" tooltip="Do customers know all your products?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
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
                        <FieldLabel label="Promotional Channels" />
                        <div className="flex flex-wrap gap-2">
                            {['Social media', 'Word of mouth', 'In-store only', 'Ads'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.marketingChannels === opt} onClick={() => onChange('marketingChannels', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Offer Awareness" tooltip="Do customers know about new products or offers?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.marketingAwareness === opt} onClick={() => onChange('marketingAwareness', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Physical Setup */}
                    <GameCard>
                        <FieldLabel label="Entrance Visibility" tooltip="Visible entrance or window?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.entranceVisibility === opt} onClick={() => onChange('entranceVisibility', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Time Spent Inside" tooltip="Do customers spend time inside?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.timeInside === opt} onClick={() => onChange('timeInside', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="QR Placement Spots" tooltip="Areas to place QR codes?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'No'].map(opt => (
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
                        <FieldLabel label="Establishment Type" emoji="🍽️" />
                        <GameSelect value={responses.foodType || 'Restaurant'} onChange={(e: any) => onChange('foodType', e.target.value)}>
                            <option>Restaurant</option>
                            <option>Fast Food / Quick Service</option>
                            <option>Local Food Canteen / Bukka</option>
                            <option>Café / Coffee Shop</option>
                            <option>Bakery</option>
                            <option>Ice Cream Shop</option>
                            <option>Juice / Smoothie Bar</option>
                            <option>Bar / Lounge</option>
                            <option>Nightclub</option>
                            <option>Catering Services</option>
                            <option>Event Food Vendor</option>
                            <option>Hotel</option>
                            <option>Guest House</option>
                            <option>Short-let Apartment</option>
                            <option>Resort</option>
                            <option>Other</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.complaints === opt} onClick={() => onChange('complaints', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Ordering & Menu Visibility */}
                    <GameCard>
                        <FieldLabel label="Menu Visibility" tooltip="Do customers easily see the menu?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.menuVisibility === opt} onClick={() => onChange('menuVisibility', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Menu Questions" tooltip="Do customers ask many questions about menu items?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.menuQuestions === opt} onClick={() => onChange('menuQuestions', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Ordering Indecision" tooltip="Do customers change their mind while ordering?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.changeMind === opt} onClick={() => onChange('changeMind', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Sales & Order Flow */}
                    <GameCard>
                        <FieldLabel label="Lost to Queues" tooltip="Do you lose customers due to long queues?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.lostCustomers === opt} onClick={() => onChange('lostCustomers', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Order Cancellations" tooltip="Do customers cancel orders after placing them?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.orderCancellations === opt} onClick={() => onChange('orderCancellations', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Data Retention (Notification) */}
                    <GameCard>
                        <FieldLabel label="Promotional Notifications" tooltip="Do you notify customers about offers?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.notifyOffers === opt} onClick={() => onChange('notifyOffers', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Physical Setup */}
                    <GameCard>
                        <FieldLabel label="Entrance Signage" tooltip="Visible entrance or signage?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.entranceVisibility === opt} onClick={() => onChange('entranceVisibility', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Time Spent (Dwell)" tooltip="Do customers sit and spend time in your space?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.timeInside === opt} onClick={() => onChange('timeInside', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="QR Placement Areas" tooltip="Tables, counters, or waiting areas available?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Many', 'Limited', 'None'].map(opt => (
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
                        <FieldLabel label="Beauty Service Type" emoji="💇" />
                        <GameSelect value={responses.beautyType || 'Hair Salon'} onChange={(e: any) => onChange('beautyType', e.target.value)}>
                            <option>Hair Salon</option>
                            <option>Barbing Salon</option>
                            <option>Nail Studio</option>
                            <option>Spa / Massage</option>
                            <option>Makeup Artist</option>
                            <option>Skincare / Facial Studio</option>
                            <option>Beauty Clinic</option>
                            <option>Tattoo Studio</option>
                            <option>Piercing Studio</option>
                            <option>Cosmetics Studio</option>
                            <option>Other</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.waitComplaints === opt} onClick={() => onChange('waitComplaints', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Service Delivery */}
                    <GameCard>
                        <FieldLabel label="Service Visibility" tooltip="Do customers know all the services you offer?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.serviceKnowledge === opt} onClick={() => onChange('serviceKnowledge', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Service/Price Questions" tooltip="Do customers ask many questions about services or prices?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.serviceQuestions === opt} onClick={() => onChange('serviceQuestions', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Service Indecision" tooltip="Do customers change their choice after discussion?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.choiceChange === opt} onClick={() => onChange('choiceChange', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Sales & Customer Loss */}
                    <GameCard>
                        <FieldLabel label="Lost to Wait" tooltip="Do you lose customers because they don't want to wait?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.lostToWait === opt} onClick={() => onChange('lostToWait', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Booking No-Shows" tooltip="Do customers fail to show up after booking?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.noShow === opt} onClick={() => onChange('noShow', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Data Retention Reminders */}
                    <GameCard>
                        <FieldLabel label="Repeat Reminders" tooltip="Do you remind customers for repeat services?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.repeatReminders === opt} onClick={() => onChange('repeatReminders', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Marketing & Visibility */}
                    <GameCard>
                        <FieldLabel label="Marketing Channels" />
                        <div className="flex flex-wrap gap-2">
                            {['Social media', 'Walk-ins', 'Referrals', 'Ads'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.marketingChannels === opt} onClick={() => onChange('marketingChannels', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Latest Offers Awareness" tooltip="Do customers know your latest services or offers?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.offersAwareness === opt} onClick={() => onChange('offersAwareness', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Physical Setup */}
                    <GameCard>
                        <FieldLabel label="Waiting Area Status" tooltip="Do you have a waiting area or seating space?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'None'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.waitingArea === opt} onClick={() => onChange('waitingArea', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Time Spent Waiting" tooltip="Do customers spend time waiting or relaxing?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
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
                        <FieldLabel label="Medical Facility Type" emoji="🏥" />
                        <GameSelect value={responses.medicalType || 'Clinic'} onChange={(e: any) => onChange('medicalType', e.target.value)}>
                            <option>Hospital</option>
                            <option>Clinic</option>
                            <option>Dental Clinic</option>
                            <option>Eye Clinic / Optometrist</option>
                            <option>Pharmacy</option>
                            <option>Laboratory / Diagnostic Center</option>
                            <option>Physiotherapy</option>
                            <option>Mental Health / Therapy Center</option>
                            <option>Maternity Center</option>
                            <option>Medical Supply Store</option>
                            <option>Other</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.waitComplaints === opt} onClick={() => onChange('waitComplaints', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Service Flow & Information */}
                    <GameCard>
                        <FieldLabel label="Procedure Clarity" tooltip="Do patients clearly understand your services or procedures?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.procedureClarity === opt} onClick={() => onChange('procedureClarity', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Inquiry Level" tooltip="Do patients ask many questions before treatment?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.questionsBefore === opt} onClick={() => onChange('questionsBefore', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Appointment Retention" tooltip="Do patients miss appointments or fail to return?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.missedAppointments === opt} onClick={() => onChange('missedAppointments', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Operational Challenges */}
                    <GameCard>
                        <FieldLabel label="Loss to Wait" tooltip="Do you lose patients due to long waiting time?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.lostToWait === opt} onClick={() => onChange('lostToWait', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Missed Follow-ups" tooltip="Do patients forget appointments or follow-ups?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.forgetFollowups === opt} onClick={() => onChange('forgetFollowups', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Patient Data & Communication */}
                    <GameCard>
                        <FieldLabel label="Care Follow-up" tooltip="Do you follow up after visits?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.followUpVisits === opt} onClick={() => onChange('followUpVisits', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Patient Awareness */}
                    <GameCard>
                        <FieldLabel label="Service Awareness" tooltip="Do patients know about your latest updates or services?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.awarenessLevel === opt} onClick={() => onChange('awarenessLevel', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Physical Setup */}
                    <GameCard>
                        <FieldLabel label="Waiting Area Status" tooltip="Do you have a waiting area?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'None'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.waitingArea === opt} onClick={() => onChange('waitingArea', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Patient Dwell Time" tooltip="Do patients spend much time waiting?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
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
                        <FieldLabel label="Service Type" emoji="⚖️" />
                        <GameSelect value={responses.profType || 'Law Firm'} onChange={(e: any) => onChange('profType', e.target.value)}>
                            <option>Law Firm / Legal Services</option>
                            <option>Accounting / Audit Firm</option>
                            <option>Tax Consultant</option>
                            <option>Business Consultant</option>
                            <option>Marketing Agency</option>
                            <option>Branding Agency</option>
                            <option>Advertising Agency</option>
                            <option>HR Consulting</option>
                            <option>Management Consulting</option>
                            <option>Public Relations (PR)</option>
                            <option>Other</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.slowResponseComplaints === opt} onClick={() => onChange('slowResponseComplaints', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Service Clarity & Communication */}
                    <GameCard>
                        <FieldLabel label="Service Clarity" tooltip="Do clients clearly understand your services and pricing?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Pre-Engagement Inquiry" tooltip="Do clients ask many questions before engaging your service?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.preEngageQuestions === opt} onClick={() => onChange('preEngageQuestions', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Decision Hesitation" tooltip="Do clients delay decision after consultation?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.decisionDelay === opt} onClick={() => onChange('decisionDelay', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Sales & Client Loss */}
                    <GameCard>
                        <FieldLabel label="Consultation Drop-off" tooltip="Do you lose clients after initial consultation?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Meeting No-Shows" tooltip="Do clients fail to show up for meetings?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.noShows === opt} onClick={() => onChange('noShows', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Follow-up */}
                    <GameCard>
                        <FieldLabel label="Lead Nurturing" tooltip="Do you follow up with potential or past clients?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.followUpPotential === opt} onClick={() => onChange('followUpPotential', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Marketing & Positioning */}
                    <GameCard>
                        <FieldLabel label="Perceived Value" tooltip="Do clients understand the value of your service?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.valueUnderstanding === opt} onClick={() => onChange('valueUnderstanding', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Promotion Intensity" tooltip="Do you actively promote your services?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Office & Digital Setup */}
                    <GameCard>
                        <FieldLabel label="Office Presence" tooltip="Do you have a physical office or meeting space?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Shared', 'No (Remote)'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.officeType === opt} onClick={() => onChange('officeType', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Team Engagement" tooltip="Do clients spend time waiting or interacting with your team?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.dwellEngagement === opt} onClick={() => onChange('dwellEngagement', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Digital Readiness" tooltip="Website, social links, or strong portfolio?" />
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
                            <option>Nursery / Primary School</option>
                            <option>Secondary School</option>
                            <option>University / Polytechnic</option>
                            <option>Private Tutor</option>
                            <option>Training Institute</option>
                            <option>Professional Certification Training</option>
                            <option>Tech Bootcamp</option>
                            <option>Driving School</option>
                            <option>Music School</option>
                            <option>Language School</option>
                            <option>Online Course Provider</option>
                            <option>Coaching Center</option>
                            <option>Other</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.inquiryLevel === opt} onClick={() => onChange('inquiryLevel', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Information Clarity */}
                    <GameCard>
                        <FieldLabel label="Course Clarity" tooltip="Do students clearly understand your courses/programs?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.courseClarity === opt} onClick={() => onChange('courseClarity', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Detail Inquiries" tooltip="Do students ask about pricing, duration, or details frequently?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.pricingInquiry === opt} onClick={() => onChange('pricingInquiry', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Interest Drop-off" tooltip="Do students drop off after showing interest?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.dropOffInterest === opt} onClick={() => onChange('dropOffInterest', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Retention */}
                    <GameCard>
                        <FieldLabel label="Pre-Enrollment Loss" tooltip="Do you lose students before they enroll?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.lostToEnroll === opt} onClick={() => onChange('lostToEnroll', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Program Completion" tooltip="Do students fail to continue or complete programs?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.retentionIssue === opt} onClick={() => onChange('retentionIssue', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Student Data & Communication */}
                    <GameCard>
                        <FieldLabel label="Update Regularity" tooltip="Do you communicate updates (classes, schedules, offers)?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.updatesLevel === opt} onClick={() => onChange('updatesLevel', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Marketing & Positioning */}
                    <GameCard>
                        <FieldLabel label="Perceived Value" tooltip="Do students understand the value of your program?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.valueUnderstanding === opt} onClick={() => onChange('valueUnderstanding', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Promotion Intensity" tooltip="Do you actively promote your programs?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Office & Digital Setup */}
                    <GameCard>
                        <FieldLabel label="Learning Space" tooltip="Do you have a physical learning space?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Hybrid', 'Online only'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.learningSpace === opt} onClick={() => onChange('learningSpace', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Pre-Class Engagement" tooltip="Do students spend time waiting or interacting before classes?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.preClassDwell === opt} onClick={() => onChange('preClassDwell', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Digital Platforms" tooltip="Digital platforms for learning or communication?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'No'].map(opt => (
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
                        <FieldLabel label="Tech Service Type" emoji="💻" />
                        <GameSelect value={responses.techType || 'Software Development'} onChange={(e: any) => onChange('techType', e.target.value)}>
                            <option>Software Development</option>
                            <option>Website Development</option>
                            <option>Mobile App Development</option>
                            <option>IT Support Services</option>
                            <option>Cybersecurity Services</option>
                            <option>Data & Analytics Services</option>
                            <option>SaaS / Tech Platform</option>
                            <option>Digital Marketing Agency</option>
                            <option>Social Media Management</option>
                            <option>Graphic Design</option>
                            <option>UI/UX Design</option>
                            <option>Printing & Branding Services</option>
                            <option>Computer Repair</option>
                            <option>Phone Repair</option>
                            <option>Internet Service Provider</option>
                            <option>Others</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Fast', 'Medium', 'Slow'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.responseSpeed === opt} onClick={() => onChange('responseSpeed', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Response Complaints" tooltip="Do clients complain about slow responses?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.responseComplaints === opt} onClick={() => onChange('responseComplaints', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Clarity & Onboarding */}
                    <GameCard>
                        <FieldLabel label="Service Clarity" tooltip="Do clients clearly understand your services/packages?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Pre-Project Questions" tooltip="Do clients ask many questions before starting?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.preprojectQuestions === opt} onClick={() => onChange('preprojectQuestions', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Project Delay" tooltip="Do clients delay starting after discussion?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.projectDelay === opt} onClick={() => onChange('projectDelay', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Sales & Project Conversion */}
                    <GameCard>
                        <FieldLabel label="Discussion Loss" tooltip="Do you lose clients after initial discussion?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.lostToDiscussion === opt} onClick={() => onChange('lostToDiscussion', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Project Abandonment" tooltip="Do clients abandon projects after starting?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.projectAbandonment === opt} onClick={() => onChange('projectAbandonment', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Client Data & Follow-up */}
                    <GameCard>
                        <FieldLabel label="Data Collection" tooltip="Do you collect client contact details properly?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Follow-up Effort" tooltip="Do you follow up with leads or inactive clients?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Marketing & Presence */}
                    <GameCard>
                        <FieldLabel label="Perceived Value" tooltip="Do clients understand the value of your service?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.perceivedValue === opt} onClick={() => onChange('perceivedValue', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Active Promotion" tooltip="Do you actively promote your services?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Digital Infrastructure */}
                    <GameCard>
                        <FieldLabel label="Online Presence" tooltip="Website/Portfolio strength?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.onlinePresence === opt} onClick={() => onChange('onlinePresence', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Onboarding Process" tooltip="Do you have a structured onboarding process?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.onboardingProcess === opt} onClick={() => onChange('onboardingProcess', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Digital Engagement" tooltip="Do clients interact with your brand digitally?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['High', 'Medium', 'Low'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.digitalInteraction === opt} onClick={() => onChange('digitalInteraction', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 8: Problems & Improvement */}
                    <GameCard>
                        <FieldLabel label="Primary Challenges" tooltip="What are your biggest challenges?" />
                        <div className="flex flex-wrap gap-2">
                            {['Low conversion', 'Poor communication', 'No onboarding', 'Weak marketing', 'Client drop-off'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.biggestChallenges === opt} onClick={() => onChange('biggestChallenges', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Improvement Need" tooltip="Rate business need for improvement" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
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
                        <FieldLabel label="Real Estate Type" emoji="🏘️" tooltip="What kind of real estate services do you provide?" />
                        <GameSelect value={responses.propertyType || 'Real Estate Agency'} onChange={(e: any) => onChange('propertyType', e.target.value)}>
                            <option>Real Estate Agency</option>
                            <option>Property Developer</option>
                            <option>Property Management</option>
                            <option>Land Sales Company</option>
                            <option>Facility Management</option>
                            <option>Surveying Services</option>
                            <option>Estate Valuation</option>
                            <option>Short-let Management</option>
                            <option>Others</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.delayedResponseComplaints === opt} onClick={() => onChange('delayedResponseComplaints', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Property Visibility */}
                    <GameCard>
                        <FieldLabel label="Property Visibility" tooltip="Can clients easily find all available listings?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.propertyVisibility === opt} onClick={() => onChange('propertyVisibility', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Info Gap" tooltip="Do you get many repetitive questions about listings?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.propertyQuestions === opt} onClick={() => onChange('propertyQuestions', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Viewing Delay" tooltip="Do clients delay decisions after site visits?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.viewingDecisionDelay === opt} onClick={() => onChange('viewingDecisionDelay', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Sales & Conversion */}
                    <GameCard>
                        <FieldLabel label="Conversion Loss" tooltip="Do you lose clients after inspection?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.conversionLoss === opt} onClick={() => onChange('conversionLoss', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Inspection No-Shows" tooltip="Rate of people missing scheduled inspections" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.noShowInspections === opt} onClick={() => onChange('noShowInspections', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Data & Follow-up */}
                    <GameCard>
                        <FieldLabel label="Data Collection" tooltip="Are you collecting lead data properly?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Follow-up Effort" tooltip="Are you following up with interested leads?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Marketing */}
                    <GameCard>
                        <FieldLabel label="Perceived Value" tooltip="Do clients understand your property value?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.valueUnderstanding === opt} onClick={() => onChange('valueUnderstanding', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Active Promotion" tooltip="Do you actively promote your listings?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Setup */}
                    <GameCard>
                        <FieldLabel label="Signage Visibility" tooltip="Do you use physical site signage?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'None'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.physicalBranding === opt} onClick={() => onChange('physicalBranding', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Digital Engagement" tooltip="Do clients interact with your portfolio digitally?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['High', 'Medium', 'Low'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.digitalEngagement === opt} onClick={() => onChange('digitalEngagement', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Digital Listing System" tooltip="Do you have a structured listing system?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'No'].map(opt => (
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
                            {['Low', 'Medium', 'High'].map(opt => (
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
                    {/* Section 1: Business Basics */}
                    <GameCard>
                        <FieldLabel label="Automotive Type" emoji="🚗" />
                        <GameSelect value={responses.autoType || 'Car Dealership'} onChange={(e: any) => onChange('autoType', e.target.value)}>
                            <option>Car Dealership</option><option>Used Car Dealer</option><option>Car Rental</option>
                            <option>Mechanic Workshop</option><option>Auto Spare Parts</option><option>Car Wash</option>
                            <option>Auto Electrical Repair</option><option>Tire Shop</option><option>Vehicle Inspection</option>
                            <option>Vehicle Tracking Services</option><option>Others</option>
                        </GameSelect>
                    </GameCard>
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
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.waitingComplaints === opt} onClick={() => onChange('waitingComplaints', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 3: Service Clarity & Process */}
                    <GameCard>
                        <FieldLabel label="Service Clarity" tooltip="Do customers clearly understand your services/prices?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.serviceClarity === opt} onClick={() => onChange('serviceClarity', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Pre-Service Questions" tooltip="Do customers ask many questions before service?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.preserviceQuestions === opt} onClick={() => onChange('preserviceQuestions', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Service Hesitation" tooltip="Do customers delay or hesitate before agreeing to service?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.serviceHesitation === opt} onClick={() => onChange('serviceHesitation', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 4: Sales & Customer Loss */}
                    <GameCard>
                        <FieldLabel label="Lost to Delay" tooltip="Do you lose customers due to waiting or delays?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.lostToDelay === opt} onClick={() => onChange('lostToDelay', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Retention Issues" tooltip="Do customers fail to return after first service?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.retentionRate === opt} onClick={() => onChange('retentionRate', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 5: Customer Data & Follow-Up */}
                    <GameCard>
                        <FieldLabel label="Data Collection" tooltip="Do you collect customer contact details?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.collectsData === opt} onClick={() => onChange('collectsData', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Follow-Up Effort" tooltip="Do you follow up with customers after service?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.followUpEffort === opt} onClick={() => onChange('followUpEffort', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 6: Marketing & Visibility */}
                    <GameCard>
                        <FieldLabel label="Service Awareness" tooltip="Do customers know about all your services?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.serviceAwareness === opt} onClick={() => onChange('serviceAwareness', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="Active Promotion" tooltip="Do you promote your services?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Sometimes', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.activePromotion === opt} onClick={() => onChange('activePromotion', opt)} />
                            ))}
                        </div>
                    </GameCard>

                    {/* Section 7: Physical Setup */}
                    <GameCard>
                        <FieldLabel label="Location Signage" tooltip="Do you have visible location or signage?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Limited', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.hasSignage === opt} onClick={() => onChange('hasSignage', opt)} />
                            ))}
                        </div>
                    </GameCard>
                    <GameCard>
                        <FieldLabel label="On-Site Waiting" tooltip="Do customers spend time waiting on-site?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Low', 'Medium', 'High'].map(opt => (
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
                            {['Low', 'Medium', 'High'].map(opt => (
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
                    <GameCard>
                        <FieldLabel label="Logistics Type" emoji="🚚" />
                        <GameSelect value={responses.logisticsType || 'Courier Service'} onChange={(e: any) => onChange('logisticsType', e.target.value)}>
                            <option>Courier Service</option><option>Delivery Company</option><option>Logistics Company</option>
                            <option>Trucking Services</option><option>Bike Delivery</option><option>Bus Transport</option><option>Other</option>
                        </GameSelect>
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
                        <FieldLabel label="Portfolio Visibility" tooltip="Do clients clearly see your past work?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.portfolioVisibility === opt} onClick={() => onChange('portfolioVisibility', opt)} />
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
                        <FieldLabel label="Product Visibility" tooltip="Can buyers clearly see available produce?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.productVisibility === opt} onClick={() => onChange('productVisibility', opt)} />
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
                        <FieldLabel label="Event Awareness" tooltip="Do members clearly know programs?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.eventAwareness === opt} onClick={() => onChange('eventAwareness', opt)} />
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
                        <FieldLabel label="Service Clarity" tooltip="Are offerings well understood?" />
                        <div className="grid grid-cols-3 gap-2">
                            {['Yes', 'Partially', 'No'].map(opt => (
                                <ChoicePill key={opt} label={opt} selected={responses.offeringClarity === opt} onClick={() => onChange('offeringClarity', opt)} />
                            ))}
                        </div>
                    </GameCard>
                </div>
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
