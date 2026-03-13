'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type CookieSettings = {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
};

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [view, setView] = useState<'banner' | 'customize'>('banner');
    const [settings, setSettings] = useState<CookieSettings>({
        essential: true,
        analytics: true,
        marketing: false,
        personalization: false,
    });

    useEffect(() => {
        const consent = localStorage.getItem('vemtap-cookie-consent');
        if (consent === null) {
            setIsVisible(true);
        }
    }, []);

    const handleAcceptAll = () => {
        const finalSettings = { essential: true, analytics: true, marketing: true, personalization: true };
        saveConsent(finalSettings);
    };

    const handleAcceptEssential = () => {
        const finalSettings = { essential: true, analytics: false, marketing: false, personalization: false };
        saveConsent(finalSettings);
    };

    const handleSaveCustom = () => {
        saveConsent(settings);
    };

    const saveConsent = (data: CookieSettings) => {
        localStorage.setItem('vemtap-cookie-consent', JSON.stringify(data));
        setIsVisible(false);
    };

    const toggleSetting = (key: keyof CookieSettings) => {
        if (key === 'essential') return;
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-100 p-6 flex justify-center">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="w-full max-w-4xl bg-white rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden relative"
                    >
                        {/* Close Button - Now saves essential consent to prevent reappearing */}
                        <button
                            onClick={handleAcceptEssential}
                            className="absolute top-6 right-6 text-gray-300 hover:text-gray-900 transition-colors"
                        >
                            <span className="material-icons-round">close</span>
                        </button>

                        <div className="p-8 md:p-10">
                            {view === 'banner' ? (
                                <div className="flex flex-col md:flex-row items-center gap-10">
                                    <div className="grow">
                                        <h3 className="text-2xl font-display font-black text-text-main mb-4 flex items-center gap-3">
                                            Let's Talk Cookies 🍪
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">
                                            We use cookies to enhance your browsing experience, personalize content, and understand site performance.
                                            By clicking "Accept all", you consent to our use of cookies that help us deliver tailored services.
                                            You can view our full <Link href="/privacy" className="text-primary font-bold underline">Cookie Policy</Link> for more details.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                        <button
                                            onClick={handleAcceptAll}
                                            className="h-12 px-8 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                                        >
                                            Accept all
                                        </button>
                                        <button
                                            onClick={handleAcceptEssential}
                                            className="h-12 px-8 bg-white text-text-main border border-gray-200 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                                        >
                                            Reject non-essential
                                        </button>
                                        <button
                                            onClick={() => setView('customize')}
                                            className="h-12 px-8 bg-white text-text-main border border-gray-200 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 group"
                                        >
                                            <span className="material-icons-round text-lg text-gray-300 group-hover:text-primary transition-colors">settings</span>
                                            Customize
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                        <h3 className="text-2xl font-display font-black text-text-main">Privacy Preferences</h3>
                                        <button
                                            onClick={() => setView('banner')}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70"
                                        >
                                            ← Back
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <CookieOption
                                            title="Strictly Necessary"
                                            description="Required for the website to function. Cannot be disabled."
                                            isActive={settings.essential}
                                            isLocked={true}
                                            onToggle={() => { }}
                                        />
                                        <CookieOption
                                            title="Performance & Analytics"
                                            description="Help us understand how visitors interact with our platform."
                                            isActive={settings.analytics}
                                            onToggle={() => toggleSetting('analytics')}
                                        />
                                        <CookieOption
                                            title="Marketing & Social"
                                            description="Used to deliver relevant ads and social media features."
                                            isActive={settings.marketing}
                                            onToggle={() => toggleSetting('marketing')}
                                        />
                                        <CookieOption
                                            title="Personalization"
                                            description="Remember your preferences and customize your journey."
                                            isActive={settings.personalization}
                                            onToggle={() => toggleSetting('personalization')}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4 gap-4">
                                        <button
                                            onClick={() => setView('banner')}
                                            className="h-12 px-8 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:text-gray-900 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveCustom}
                                            className="h-12 px-12 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/10"
                                        >
                                            Save My Preferences
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function CookieOption({ title, description, isActive, isLocked = false, onToggle }: {
    title: string;
    description: string;
    isActive: boolean;
    isLocked?: boolean;
    onToggle: () => void;
}) {
    return (
        <div
            onClick={!isLocked ? onToggle : undefined}
            className={`p-6 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between group ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}
        >
            <div className="pr-10">
                <p className={`font-bold text-sm mb-1 ${isActive ? 'text-primary' : 'text-text-main'}`}>{title}</p>
                <p className="text-[10px] text-gray-400 font-bold leading-tight">{description}</p>
            </div>
            <div className={`size-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary text-white' : 'bg-white text-gray-200 border border-gray-100'}`}>
                <span className="material-icons-round text-xl">
                    {isLocked ? 'lock' : (isActive ? 'check' : 'toggle_off')}
                </span>
            </div>
        </div>
    );
}

