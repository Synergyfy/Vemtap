'use client';

import React, { useState, useEffect } from 'react';
import { notify } from '@/lib/notify';
import { User, Mail, Phone, Bell, Shield, Trash2, Camera, Check, LogOut, ChevronRight, Laptop, Smartphone, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChangePassword } from '@/services/auth/hooks';
import { useRegisterPushToken } from '@/services/notifications/hooks';

export default function CustomerSettingsPage() {
    const searchParams = useSearchParams();
    const isAdminMode = searchParams.get('admin_mode') === '1';
    const { user, logout, updateUser } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Push Notification States
    const [pushSupported, setPushSupported] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);

    const registerPushToken = useRegisterPushToken();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && ['profile', 'security', 'notifications', 'devices'].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
            setPushSupported(supported);
            if (supported) {
                setPushPermission(Notification.permission);
                checkPushStatus();
            }
        }
    }, []);

    const checkPushStatus = async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            setPushSubscribed(!!subscription);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i += 1) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const handleTogglePush = async () => {
        if (!pushSupported) {
            notify.error('Push notifications are not supported on this device');
            return;
        }

        setPushLoading(true);
        try {
            if (pushSubscribed) {
                // Disable
                const registration = await navigator.serviceWorker.getRegistration();
                const subscription = await registration?.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
                setPushSubscribed(false);
                notify.success('Notifications disabled');
            } else {
                // Enable
                const permission = await Notification.requestPermission();
                setPushPermission(permission);
                if (permission !== 'granted') {
                    notify.error('Notification permission denied');
                    return;
                }

                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    notify.error('System error: Missing VAPID key');
                    return;
                }

                await navigator.serviceWorker.register('/sw.js');
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });

                await registerPushToken.mutateAsync({ token: JSON.stringify(subscription) });
                setPushSubscribed(true);
                notify.success('Notifications enabled successfully!');
            }
        } catch (error: any) {
            notify.error(error.message || 'Failed to update notification settings');
        } finally {
            setPushLoading(false);
        }
    };

    const { changePassword, isLoading: isChangingPassword } = useChangePassword();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [name, setName] = useState(user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '');
    const [phone, setPhone] = useState(user?.phone || '');


    useEffect(() => {
        if (user) {
            setName(user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const result = await updateUser({ firstName, lastName, phone });
            if (result.success) {
                notify.success('Platform sync: Your profile has been updated!');
            } else {
                notify.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            notify.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            notify.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            notify.error('Password must be at least 8 characters long');
            return;
        }

        try {
            await changePassword({ currentPassword, newPassword });
            notify.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            notify.error(error.message || 'Failed to change password');
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const joinedDateRaw = user?.createdAt || user?.joined;
    const joinedDate = joinedDateRaw
        ? new Date(joinedDateRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
        : '—';

    return (
        <div className="max-w-4xl mx-auto space-y-5 md:space-y-8 pb-20 p-4 md:p-0">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-text-main tracking-tight">Identity Center</h1>
                    <p className="text-text-secondary font-medium mt-0.5">Manage your digital presence and privacy preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Left Column: Navigation/Profile Summary */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-20 bg-linear-to-r from-primary/10 to-blue-500/10"></div>

                        <div className="relative mt-3 mb-4 inline-block">
                            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary">
                                    <User size={32} />
                                </div>
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg hover:scale-110 transition-all">
                                <Camera size={14} />
                            </button>
                        </div>

                        <h2 className="text-lg font-display font-bold text-text-main">{user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'}</h2>

                        <div className="mt-5 pt-5 border-t border-gray-50 flex items-center justify-center gap-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Joined</p>
                                <p className="text-base font-bold text-text-main">{joinedDate}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        {[
                            { id: 'profile', label: 'Identity Profile', icon: User },
                            { id: 'security', label: 'Security & Privacy', icon: Shield, hidden: isAdminMode },
                            { id: 'notifications', label: 'Alert Preferences', icon: Bell },
                            { id: 'devices', label: 'Linked Devices', icon: Laptop },
                        ].filter(item => !item.hidden).map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all ${isActive ? 'bg-primary/5 text-primary border-r-4 border-primary' : 'text-text-secondary hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} />
                                        {item.label}
                                    </div>
                                    <ChevronRight size={16} className={isActive ? 'opacity-100' : 'opacity-30'} />
                                </button>
                            );
                        })}
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="w-full h-12 bg-red-50 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100/50 active:scale-95"
                    >
                        <LogOut size={16} />
                        Terminate Session
                    </button>
                </div>

                {/* Right Column: Active Form */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    {activeTab === 'profile' && (
                        <>
                            {/* Profile Details */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>

                                <h3 className="text-lg font-display font-bold text-text-main mb-4 md:mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                                            <User size={12} className="text-primary" />
                                            Legal Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                                            <Mail size={12} className="text-primary" />
                                            Email Domain
                                        </label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm font-bold bg-gray-100/50 text-text-secondary focus:outline-none transition-all outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                                            <Phone size={12} className="text-primary" />
                                            Mobile Verification
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-display font-bold text-text-main flex items-center gap-3">
                                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                            Alert Matrix
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer group" onClick={handleTogglePush}>
                                            <div>
                                                <p className="font-bold text-sm text-text-main flex items-center gap-2">
                                                    Order Status Notifications
                                                    {pushLoading && <Loader2 className="animate-spin text-primary" size={14} />}
                                                </p>
                                                <p className="text-xs text-text-secondary font-medium">Receive real-time alerts for your orders</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                                                <input type="checkbox" className="sr-only peer" checked={pushSubscribed} readOnly />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>

                                        {[
                                            { label: 'Reward Unlocked Notifications', desc: 'Alert me instantly when a voucher is ready for use', checked: true },
                                            { label: 'Activity Summaries', desc: 'Weekly digest of my check-ins and savings', checked: true },
                                            { label: 'SMS Security Alerts', desc: 'Notice for logins from unrecognized devices', checked: false },
                                        ].map((pref, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer group opacity-50">
                                                <div>
                                                    <p className="font-bold text-sm text-text-main">{pref.label}</p>
                                                    <p className="text-xs text-text-secondary font-medium">{pref.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked={pref.checked} disabled />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="w-full h-12 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-primary-hover transition-all shadow-2xl shadow-primary/30 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                Update Profile Structure
                                                <Check size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                                </div>

                                {/* Security / Danger Zone */}
                                {!isAdminMode && (
                                <div className="bg-red-50/50 border-2 border-dashed border-red-100 rounded-2xl p-4 md:p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4 text-red-800">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                                <Trash2 size={20} />
                                            </div>
                                            <h3 className="text-lg font-display font-bold">Data Purge Protocol</h3>
                                        </div>
                                        <p className="text-sm text-red-700/80 mb-4 font-medium leading-relaxed max-w-xl text-balance">
                                            Initiating an account deletion will permanently erase your check-in history, earned points, and active vouchers from the VemTap decentralized ledger. This action is irreversible.
                                        </p>
                                        <button className="h-12 px-6 border-2 border-red-200 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 shadow-lg shadow-red-200/50">
                                            Request Account Termination
                                        </button>
                                    </div>
                                </div>
                                )}
                                </>
                                )}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm relative overflow-hidden">
                            <h3 className="text-lg font-display font-bold text-text-main mb-4 md:mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                Security & Privacy
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-text-main flex items-center gap-2 mb-1.5">
                                                <Shield size={16} className="text-primary" />
                                                Account Password
                                            </h4>
                                            <p className="text-xs text-text-secondary max-w-sm leading-relaxed mb-4">
                                                Update your password to keep your account secure. We recommend changing it periodically.
                                            </p>
                                        </div>

                                        <div className="space-y-3 max-w-md">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    required
                                                    className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-1">
                                            <button
                                                type="submit"
                                                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                                                className="px-6 h-11 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isChangingPassword ? (
                                                    <Loader2 className="animate-spin" size={16} />
                                                ) : (
                                                    'Update Password'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                                <Laptop size={16} className="text-primary" />
                                                Two-Factor Authentication
                                            </h4>
                                            <p className="text-xs text-text-secondary mt-2 max-w-sm leading-relaxed">
                                                Add an extra layer of security to your account by enabling two-factor authentication.
                                            </p>
                                        </div>
                                        <div className="flex items-center h-10 px-4 rounded-xl bg-gray-200/50 text-text-secondary font-bold text-[10px] uppercase tracking-widest">
                                            Coming Soon
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab !== 'profile' && activeTab !== 'security') && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                                <Laptop size={22} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-display font-bold text-text-main mb-1.5">Coming Soon</h3>
                            <p className="text-sm text-text-secondary max-w-xs mx-auto">
                                We are working hard to bring this feature to you. Check back soon for updates!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
