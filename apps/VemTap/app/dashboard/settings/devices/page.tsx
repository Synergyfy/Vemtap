'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function DeviceSettingsPage() {
    const {
        customWelcomeMessage,
        customSuccessMessage,
        customPrivacyMessage,
        customRewardMessage,
        hasRewardSetup,
        updateCustomSettings
    } = useCustomerFlowStore();
    const { user } = useAuthStore();

    // Fix for ReferenceError: window is not defined
    const [origin, setOrigin] = useState('');
    const [mounted, setMounted] = useState(false);

    const [welcome, setWelcome] = useState(customWelcomeMessage || "Welcome to Green Terrace!");
    const [success, setSuccess] = useState(customSuccessMessage || "Check-in Complete!");
    const [privacy, setPrivacy] = useState(customPrivacyMessage || "Your data is only used for session verification and loyalty tracking.");
    const [reward, setReward] = useState(customRewardMessage || "Get 10% OFF your next visit!");
    const [rewardEnabled, setRewardEnabled] = useState(hasRewardSetup);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const handleSave = () => {
        updateCustomSettings({
            welcomeMessage: welcome,
            successMessage: success,
            privacyMessage: privacy,
            rewardMessage: reward,
            rewardEnabled: rewardEnabled
        });
        toast.success('Configuration saved locally');
    };

    // Prevent rendering until mounted to avoid hydration mismatch
    if (!mounted) return null;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <PageHeader
                title="Device Settings"
                description="Configure default behaviors for your NFC tap points"
                actions={
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20">
                        Save Configuration
                    </button>
                }
            />

            <div className="space-y-8">
                {/* Interaction Rules */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main">Tap Behavior</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-text-main text-sm">One-Tap Sign-in</h4>
                                <p className="text-xs text-text-secondary mt-1">Automatically check-in returning users without form submission</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <hr className="border-gray-100" />

                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-text-main text-sm">Cooldown Period</h4>
                                <p className="text-xs text-text-secondary mt-1">Seconds to wait before allowing another tap from the same device</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="number" defaultValue={60} className="w-20 h-10 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-bold text-center outline-none focus:bg-white focus:ring-2 focus:ring-primary/20" />
                                <span className="text-xs font-bold text-text-secondary">Sec</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Default UI */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-display font-bold text-text-main">Visitor Journey Customization</h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                            <span className="material-icons-round text-primary text-xs">visibility</span>
                            <span className="text-[10px] font-bold text-primary uppercase">Live Preview Active</span>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Landing Page Title</label>
                                <input type="text" value={welcome} onChange={(e) => setWelcome(e.target.value)} className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Success Page Title</label>
                                <input type="text" value={success} onChange={(e) => setSuccess(e.target.value)} className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Privacy Message (Optional)</label>
                            <textarea value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none" />
                        </div>

                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-bold text-text-main text-sm">Reward Engine</h4>
                                    <p className="text-xs text-text-secondary mt-1">Show a digital reward after successful tap</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={rewardEnabled} onChange={(e) => setRewardEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <input type="text" value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Reward Message (e.g. Free Coffee)" className="w-full h-11 bg-white border border-primary/10 rounded-xl px-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                        </div>

                        <div className="pt-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Physical Device Link</label>
                            <div className="flex items-center gap-2 p-4 bg-gray-900 rounded-xl overflow-hidden">
                                <code className="text-xs text-green-400 font-mono flex-1 truncate">
                                    {origin}/tap/{user?.businessName?.replace(/\s+/g, '-').toUpperCase() || 'MY-STORE'}/PLATE-01
                                </code>
                                <button onClick={() => {
                                    const businessSlug = user?.businessName?.replace(/\s+/g, '-').toUpperCase() || 'MY-STORE';
                                    const url = `${origin}/tap/${businessSlug}/PLATE-01`;
                                    navigator.clipboard.writeText(url);
                                    toast.success('Hierarchical device link copied');
                                }} className="text-white/40 hover:text-white transition-colors">
                                    <span className="material-icons-round text-sm">content_copy</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-text-secondary mt-2">* This is the URL programmed into your NFC plates.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
