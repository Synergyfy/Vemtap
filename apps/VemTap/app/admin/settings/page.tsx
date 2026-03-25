'use client';

import React, { useState, useEffect } from 'react';
import { notify } from '@/lib/notify';
import { useSystemSettingsStore } from '@/store/useSystemSettingsStore';
import { 
    Settings, 
    ShieldCheck, 
    CreditCard, 
    Bell, 
    Smartphone, 
    MessageSquare, 
    Save,
    History,
    RefreshCw,
    Link
} from 'lucide-react';
import { useRegisterPushToken } from '@/services/notifications/hooks';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
    const settings = useSystemSettingsStore();
    const [activeTab, setActiveTab] = useState('general');
    const [localSettings, setLocalSettings] = useState({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        currency: settings.currency,
        timezone: settings.timezone,
        messagingCosts: { ...settings.messagingCosts },
        enforce2FA: settings.enforce2FA,
        passwordExpiry: settings.passwordExpiry
    });

    useEffect(() => {
        setLocalSettings({
            platformName: settings.platformName,
            supportEmail: settings.supportEmail,
            currency: settings.currency,
            timezone: settings.timezone,
            messagingCosts: { ...settings.messagingCosts },
            enforce2FA: settings.enforce2FA,
            passwordExpiry: settings.passwordExpiry
        });
    }, [settings.platformName, settings.supportEmail, settings.currency, settings.timezone, settings.messagingCosts, settings.enforce2FA, settings.passwordExpiry]);

    const handleSave = () => {
        settings.updateSettings(localSettings);
        notify.success('System settings updated successfully');
    };

    return (
        <div className="p-8 pb-20">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Administration</p>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">System Settings</h1>
                    <p className="text-text-secondary font-medium">Configure global platform parameters and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                    <Save size={16} />
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Settings Navigation */}
                <div className="w-full lg:w-72 shrink-0">
                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <nav className="flex flex-col p-2">
                            {[
                                { id: 'general', label: 'General Configuration', icon: Settings },
                                { id: 'messaging', label: 'Messaging Costs', icon: Smartphone },
                                { id: 'security', label: 'Security & Access', icon: ShieldCheck },
                                { id: 'payment', label: 'Payment Gateways', icon: CreditCard },
                                { id: 'notifications', label: 'Notifications', icon: Bell },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-3 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${activeTab === item.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-text-secondary hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'general' && (
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8 shadow-sm">
                                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                                        <div className="size-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <Settings size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-text-main uppercase tracking-tight">General Configuration</h2>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Global platform metadata</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Platform Name</label>
                                            <input 
                                                type="text" 
                                                value={localSettings.platformName} 
                                                onChange={(e) => setLocalSettings({ ...localSettings, platformName: e.target.value })}
                                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Support Email</label>
                                            <input 
                                                type="email" 
                                                value={localSettings.supportEmail} 
                                                onChange={(e) => setLocalSettings({ ...localSettings, supportEmail: e.target.value })}
                                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Default Currency</label>
                                            <select 
                                                value={localSettings.currency} 
                                                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white transition-all"
                                            >
                                                <option value="NGN">NGN (Nigerian Naira)</option>
                                                <option value="USD">USD (US Dollar)</option>
                                                <option value="GBP">GBP (British Pound)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Timezone</label>
                                            <select 
                                                value={localSettings.timezone} 
                                                onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:bg-white transition-all"
                                            >
                                                <option value="Africa/Lagos">West Africa Time (Lagos)</option>
                                                <option value="UTC">UTC</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'messaging' && (
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8 shadow-sm">
                                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                                        <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Messaging Costs</h2>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Credits charged per outbound message</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <Smartphone size={20} className="text-primary" />
                                                </div>
                                                <h3 className="font-bold text-slate-800">SMS Gateway</h3>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                Standard SMS cost application-wide. This will be deducted from business credits for every sent message.
                                            </p>
                                            <div className="space-y-1.5 pt-2">
                                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Cost per SMS (Credits)</label>
                                                <input 
                                                    type="number" 
                                                    value={localSettings.messagingCosts.sms} 
                                                    onChange={(e) => setLocalSettings({ 
                                                        ...localSettings, 
                                                        messagingCosts: { ...localSettings.messagingCosts, sms: Number(e.target.value) } 
                                                    })}
                                                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-black text-lg text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                                                />
                                            </div>
                                        </div>

                                        <div className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <MessageSquare size={20} className="text-emerald-500" />
                                                </div>
                                                <h3 className="font-bold text-slate-800">WhatsApp Bridge</h3>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                WhatsApp Business API costs. Typically higher due to Meta conversation-based pricing.
                                            </p>
                                            <div className="space-y-1.5 pt-2">
                                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Cost per WhatsApp (Credits)</label>
                                                <input 
                                                    type="number" 
                                                    value={localSettings.messagingCosts.whatsapp} 
                                                    onChange={(e) => setLocalSettings({ 
                                                        ...localSettings, 
                                                        messagingCosts: { ...localSettings.messagingCosts, whatsapp: Number(e.target.value) } 
                                                    })}
                                                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-black text-lg text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                        <History size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-amber-800">Propagation Note</p>
                                            <p className="text-[10px] text-amber-700 font-medium leading-relaxed mt-0.5">
                                                Changes to messaging costs will apply immediately to all new outbound messages. Existing scheduled campaigns will retain their original pricing.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8 shadow-sm">
                                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                                        <div className="size-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Security Settings</h2>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Platform access controls</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="font-bold text-text-main text-sm">Enforce 2FA for Admins</p>
                                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Required for all administrative accounts</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={localSettings.enforce2FA} 
                                                    onChange={(e) => setLocalSettings({ ...localSettings, enforce2FA: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-4 ring-transparent peer-focus:ring-primary/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="font-bold text-text-main text-sm">Force Password Expiry</p>
                                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Require reset every 90 days</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={localSettings.passwordExpiry} 
                                                    onChange={(e) => setLocalSettings({ ...localSettings, passwordExpiry: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-4 ring-transparent peer-focus:ring-primary/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8 shadow-sm">
                                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                                        <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Bell size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Notification Settings</h2>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Configure platform delivery channels</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Push Notifications Section */}
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary">
                                                        <Smartphone size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-sm">Browser Push Notifications</h3>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Receive real-time alerts on this device</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const mockToken = `fcm-token-${Math.random().toString(36).substr(2, 9)}`;
                                                        toast.promise(
                                                            api.post('/notifications/push-token', { token: mockToken }),
                                                            {
                                                                loading: 'Requesting permission...',
                                                                success: 'Push notifications enabled successfully',
                                                                error: 'Failed to enable push notifications'
                                                            }
                                                        );
                                                    }}
                                                    className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2"
                                                >
                                                    <RefreshCw size={14} />
                                                    Enable on this device
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Status</span>
                                                    <span className="px-2 py-1 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded-md border border-green-100">Operational</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">FCM Integration</span>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-md border border-blue-100">Connected</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notification Channels */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Email Alerts', enabled: true },
                                                { label: 'SMS Notifications', enabled: false },
                                                { label: 'WhatsApp Updates', enabled: false }
                                            ].map((channel, i) => (
                                                <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">{channel.label}</span>
                                                    <div className={`w-2 h-2 rounded-full ${channel.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                                        <Link size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-blue-800">Advanced Configuration</p>
                                            <p className="text-[10px] text-blue-700 font-medium leading-relaxed mt-0.5">
                                                To configure provider-specific gateway credentials (Twilio, SendGrid, etc.), please visit the <button onClick={() => setActiveTab('api')} className="font-bold underline">API & Integrations</button> tab.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payment' && (
                                <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                                    <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CreditCard size={40} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-main mb-2">Module Under Construction</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 font-medium">This configuration module is being prepared and will be available in the next system update.</p>
                                    <button 
                                        onClick={() => setActiveTab('general')}
                                        className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                                    >
                                        Return to General Settings
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
