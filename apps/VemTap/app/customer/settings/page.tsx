'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notify } from '@/lib/notify';
import { User, Mail, Phone, Bell, Shield, Trash2, Camera, Check, LogOut, ChevronRight, Laptop, Smartphone, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChangePassword } from '@/services/auth/hooks';
import { useRegisterPushToken, useClearPushToken, useNotificationPreferences, useUpdateNotificationPreferences } from '@/services/notifications/hooks';
import { useLinkedDevices, useRenameDevice, useRevokeDevice } from '@/services/users/hooks';
import { useSetup2FA, useConfirm2FA, useDisable2FA, useSendEmailVerification, useVerifyEmail } from '@/services/auth/hooks';
import { uploadToCloudinary } from '@/lib/cloudinary';
import {
    getPushSupportInfo,
    getCurrentPermission,
    requestNotificationPermission,
    getPushSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    detectBrowser,
} from '@/lib/pushNotifications';

export default function CustomerSettingsPage() {
    const searchParams = useSearchParams();
    const isAdminMode = searchParams.get('admin_mode') === '1';
    const { user, logout, updateUser } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Push Notification States
    const [pushSupported, setPushSupported] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);

    const registerPushToken = useRegisterPushToken();
    const clearPushToken = useClearPushToken();

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
            const supported = getPushSupportInfo().supported;
            setPushSupported(supported);
            if (supported) {
                setPushPermission(getCurrentPermission());
                checkPushStatus();
            } else {
                // On unsupported browsers, restore the in-app preference
                setPushSubscribed(localStorage.getItem('push-preference') === 'true');
            }
        }
    }, []);

    const checkPushStatus = async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
        const subscription = await getPushSubscription();
        setPushSubscribed(!!subscription);
    };

    const handleTogglePush = async () => {
        if (!pushSupported) {
            // On unsupported browsers (e.g. iOS Safari), just flip the preference
            const next = !pushSubscribed;
            setPushSubscribed(next);
            localStorage.setItem('push-preference', next ? 'true' : 'false');
            notify.success(next ? 'In-app notifications enabled' : 'In-app notifications disabled');
            return;
        }

        setPushLoading(true);
        try {
            if (pushSubscribed) {
                // Disable
                await unsubscribeFromPush();
                try {
                    await clearPushToken.mutateAsync();
                } catch {
                    // Best effort — clearing the local subscription is enough.
                }
                setPushSubscribed(false);
                localStorage.setItem('push-preference', 'false');
                notify.success('Notifications disabled');
            } else {
                // Enable
                let permission = getCurrentPermission();

                // Previously declined: browsers never re-prompt after 'denied'.
                if (permission === 'denied') {
                    setPushPermission(permission);
                    const browser = detectBrowser();
                    notify.error(`Notifications are blocked for this site in ${browser.name}. Add this site to the "Allowed to send notifications" list under ${browser.settingsLabel}, then try again.`);
                    return;
                }

                if (permission !== 'granted') {
                    // New user (or previously dismissed) — request inside the user gesture.
                    permission = await requestNotificationPermission();
                    setPushPermission(permission);

                    if (permission === 'denied') {
                        const browser = detectBrowser();
                        notify.error(`Notifications are blocked for this site in ${browser.name}. Add this site to the "Allowed to send notifications" list under ${browser.settingsLabel}, then try again.`);
                        return;
                    }

                    if (permission !== 'granted') {
                        const browser = detectBrowser();
                        const quietHint = browser.hasQuietPromptSetting
                            ? ` ${browser.name} has a "Quiet notification requests" setting that suppresses the popup — turning it off also helps.`
                            : '';
                        notify.error(`${browser.name} did not show the permission prompt. Add this site to the "Allowed to send notifications" list under ${browser.settingsLabel}, or click ${browser.addressBarIconHint} and choose Allow, then try again.${quietHint}`);
                        return;
                    }
                }

                const subscription = await subscribeToPush();
                await registerPushToken.mutateAsync({ token: JSON.stringify(subscription) });
                setPushSubscribed(true);
                localStorage.setItem('push-preference', 'true');
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
    const [profileEditing, setProfileEditing] = useState(false);

    // Notification preferences from backend
    const { data: notifPrefs } = useNotificationPreferences();
    const updatePrefs = useUpdateNotificationPreferences();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [renamingDeviceId, setRenamingDeviceId] = useState<string | null>(null);
    const [deviceName, setDeviceName] = useState('');
    const { data: devices = [] } = useLinkedDevices();
    const renameDevice = useRenameDevice();
    const revokeDevice = useRevokeDevice();
    const setup2FA = useSetup2FA();
    const confirm2FA = useConfirm2FA();
    const disable2FA = useDisable2FA();
    const sendEmailVerification = useSendEmailVerification();
    const verifyEmail = useVerifyEmail();
    const [twoFASetup, setTwoFASetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
    const [twoFACode, setTwoFACode] = useState('');
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [show2FADisable, setShow2FADisable] = useState(false);
    const [disable2FACode, setDisable2FACode] = useState('');
    const [emailVerifyMode, setEmailVerifyMode] = useState(false);
    const [emailVerifyCode, setEmailVerifyCode] = useState('');
    const [emailVerifySent, setEmailVerifySent] = useState(false);


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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            notify.error('Image must be under 5MB');
            return;
        }
        setAvatarUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            await updateUser({ avatar: url });
            notify.success('Profile photo updated');
        } catch {
            notify.error('Failed to upload image');
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            await updateUser({ name, phone });
            notify.success('Profile updated');
            setProfileEditing(false);
        } catch {
            notify.error('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
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
                            <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary">
                                        <User size={32} />
                                    </div>
                                )}
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg hover:scale-110 transition-all disabled:opacity-50"
                            >
                                {avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
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
                        Sign out
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
                                    <button
                                        onClick={() => {
                                            if (profileEditing) {
                                                handleSaveProfile();
                                            } else {
                                                setProfileEditing(true);
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="ml-auto text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : profileEditing ? 'Save' : 'Edit'}
                                    </button>
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
readOnly={!profileEditing}
                                            className={`w-full h-12 px-4 border border-gray-200 rounded-xl text-sm font-bold transition-all outline-none ${profileEditing ? 'bg-white focus:outline-none focus:ring-4 focus:ring-primary/10' : 'bg-gray-50/50 cursor-default'}`}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                                            <Mail size={12} className="text-primary" />
                                            Email Domain
                                        </label>
                                        <div className="flex gap-2 min-w-0">
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="flex-1 min-w-0 h-12 px-4 border border-gray-200 rounded-xl text-sm font-bold bg-gray-100/50 text-text-secondary focus:outline-none transition-all outline-none cursor-not-allowed"
                                            />
                                            {user?.emailVerified ? (
                                                <span className="flex items-center gap-1 px-3 h-12 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-xl whitespace-nowrap">
                                                    <Check size={14} /> Verified
                                                </span>
                                            ) : emailVerifyMode ? null : (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await sendEmailVerification.sendVerification();
                                                            setEmailVerifySent(true);
                                                            setEmailVerifyMode(true);
                                                            notify.success('Verification code sent to your email');
                                                        } catch {}
                                                    }}
                                                    disabled={sendEmailVerification.isLoading}
                                                    className="px-3 h-12 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-primary/20 transition-all whitespace-nowrap disabled:opacity-50"
                                                >{sendEmailVerification.isLoading ? 'Sending...' : 'Verify'}</button>
                                            )}
                                        </div>
                                        {emailVerifyMode && emailVerifySent && (
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    value={emailVerifyCode}
                                                    onChange={(e) => setEmailVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    placeholder="Enter 6-digit code"
                                                    className="flex-1 h-10 px-4 border border-gray-200 rounded-xl text-sm font-bold tracking-wider focus:outline-none focus:ring-4 focus:ring-primary/10"
                                                />
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await verifyEmail.verifyEmail({ email: user?.email || '', code: emailVerifyCode });
                                                            setEmailVerifyMode(false);
                                                            setEmailVerifyCode('');
                                                            setEmailVerifySent(false);
                                                            notify.success('Email verified!');
                                                        } catch {}
                                                    }}
                                                    disabled={emailVerifyCode.length !== 6 || verifyEmail.isLoading}
                                                    className="px-4 h-10 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
                                                >{verifyEmail.isLoading ? 'Verifying...' : 'Submit'}</button>
                                                {verifyEmail.error && <p className="text-xs text-red-500 w-full">{verifyEmail.error}</p>}
                                            </div>
                                        )}
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
readOnly={!profileEditing}
                                            className={`w-full h-12 px-4 border border-gray-200 rounded-xl text-sm font-bold transition-all outline-none ${profileEditing ? 'bg-white focus:outline-none focus:ring-4 focus:ring-primary/10' : 'bg-gray-50/50 cursor-default'}`}
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
                                            { label: 'Reward Unlocked Notifications', desc: 'Alert me instantly when a voucher is ready for use', checked: notifPrefs?.rewardAlerts ?? true, onToggle: (v: boolean) => updatePrefs.mutate({ rewardAlerts: v }) },
                                            { label: 'Activity Summaries', desc: 'Weekly digest of my check-ins and savings', checked: notifPrefs?.activityDigest ?? true, onToggle: (v: boolean) => updatePrefs.mutate({ activityDigest: v }) },
                                            { label: 'SMS Security Alerts', desc: 'Notice for logins from unrecognized devices', checked: notifPrefs?.smsSecurity ?? false, onToggle: (v: boolean) => updatePrefs.mutate({ smsSecurity: v }) },
                                        ].map((pref, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer group">
                                                <div>
                                                    <p className="font-bold text-sm text-text-main">{pref.label}</p>
                                                    <p className="text-xs text-text-secondary font-medium">{pref.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); pref.onToggle(!pref.checked); }}>
                                                    <input type="checkbox" className="sr-only peer" checked={pref.checked} readOnly />
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
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="h-12 px-6 border-2 border-red-200 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 shadow-lg shadow-red-200/50"
                                        >
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
                                            {user?.twoFactorEnabled && (
                                                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                                    <Check size={12} /> Enabled
                                                </span>
                                            )}
                                        </div>
                                        {user?.twoFactorEnabled ? (
                                            <button
                                                onClick={() => setShow2FADisable(true)}
                                                className="h-10 px-4 rounded-xl bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                                            >Disable</button>
                                        ) : show2FASetup ? null : (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const result = await setup2FA.setup();
                                                        setTwoFASetup(result);
                                                        setShow2FASetup(true);
                                                    } catch {}
                                                }}
                                                disabled={setup2FA.isLoading}
                                                className="h-10 px-4 rounded-xl bg-primary text-white font-bold text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all disabled:opacity-50"
                                            >{setup2FA.isLoading ? 'Setting up...' : 'Enable'}</button>
                                        )}
                                    </div>
                                    {show2FASetup && twoFASetup && (
                                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl space-y-4">
                                            <p className="text-xs text-text-secondary font-medium">1. Scan this QR code with your authenticator app:</p>
                                            <div className="flex justify-center">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFASetup.otpauthUrl)}`} alt="2FA QR Code" className="w-48 h-48 rounded-lg border border-gray-100" />
                                            </div>
                                            <p className="text-xs text-text-secondary font-medium text-center">Or enter this key manually: <span className="font-bold text-text-main">{twoFASetup.secret}</span></p>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">2. Enter the 6-digit code from your app</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={twoFACode}
                                                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        placeholder="000000"
                                                        className="flex-1 h-11 px-4 border border-gray-200 rounded-xl text-sm font-bold text-center tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-primary/10"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await confirm2FA.confirm(twoFACode);
                                                                setShow2FASetup(false);
                                                                setTwoFASetup(null);
                                                                setTwoFACode('');
                                                                notify.success('Two-factor authentication enabled!');
                                                            } catch {}
                                                        }}
                                                        disabled={twoFACode.length !== 6 || confirm2FA.isLoading}
                                                        className="px-6 h-11 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
                                                    >{confirm2FA.isLoading ? 'Verifying...' : 'Verify'}</button>
                                                </div>
                                                {confirm2FA.error && <p className="text-xs text-red-500">{confirm2FA.error}</p>}
                                            </div>
                                            <button onClick={() => { setShow2FASetup(false); setTwoFASetup(null); }} className="text-xs text-text-secondary font-bold">Cancel</button>
                                        </div>
                                    )}
                                    {show2FADisable && (
                                        <div className="mt-4 p-4 bg-white border border-red-200 rounded-xl space-y-3">
                                            <p className="text-xs text-text-secondary font-medium">Enter a 6-digit code from your authenticator app to disable 2FA:</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={disable2FACode}
                                                    onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    placeholder="000000"
                                                    className="flex-1 h-11 px-4 border border-gray-200 rounded-xl text-sm font-bold text-center tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-primary/10"
                                                />
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await disable2FA.disable(disable2FACode);
                                                            setShow2FADisable(false);
                                                            setDisable2FACode('');
                                                            notify.success('2FA disabled');
                                                        } catch {}
                                                    }}
                                                    disabled={disable2FACode.length !== 6 || disable2FA.isLoading}
                                                    className="px-6 h-11 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                                                >{disable2FA.isLoading ? 'Disabling...' : 'Disable'}</button>
                                            </div>
                                            {disable2FA.error && <p className="text-xs text-red-500">{disable2FA.error}</p>}
                                            <button onClick={() => { setShow2FADisable(false); setDisable2FACode(''); }} className="text-xs text-text-secondary font-bold">Cancel</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'devices' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
                            <h3 className="text-lg font-display font-bold text-text-main mb-4 md:mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                Linked Devices
                            </h3>
                            {devices.length === 0 ? (
                                <div className="text-center py-8 text-text-secondary">
                                    <Laptop size={32} className="mx-auto mb-3 text-gray-300" />
                                    <p className="font-bold text-sm">No linked devices</p>
                                    <p className="text-xs mt-1">Devices you use to access VemTap will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {devices.map((device) => (
                                        <div key={device.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                                    {device.platform?.toLowerCase().includes('ios') || device.platform?.toLowerCase().includes('iphone') ? <Smartphone size={18} /> : <Laptop size={18} />}
                                                </div>
                                                <div>
                                                    {renamingDeviceId === device.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={deviceName}
                                                                onChange={(e) => setDeviceName(e.target.value)}
                                                                className="h-8 px-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    renameDevice.mutate({ id: device.id, deviceName }, { onSuccess: () => { setRenamingDeviceId(null); setDeviceName(''); } });
                                                                }}
                                                                className="text-primary text-xs font-bold"
                                                            >Save</button>
                                                            <button onClick={() => setRenamingDeviceId(null)} className="text-text-secondary text-xs font-bold">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="font-bold text-sm text-text-main">
                                                                {device.deviceName || device.platform || 'Unknown device'}
                                                            </p>
                                                            <p className="text-xs text-text-secondary">Last active: {device.lastActiveAt ? new Date(device.lastActiveAt).toLocaleDateString() : 'Unknown'}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setRenamingDeviceId(device.id); setDeviceName(device.deviceName || ''); }}
                                                    className="text-xs text-text-secondary hover:text-primary font-bold transition-colors"
                                                >Rename</button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Revoke access for this device?')) {
                                                            revokeDevice.mutate(device.id);
                                                            }
                                                        }}
                                                        className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors"
                                                    >Revoke</button>
                                                </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab !== 'profile' && activeTab !== 'security' && activeTab !== 'devices' && activeTab !== 'notifications' && (
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

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="size-20 rounded-3xl bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Delete Account?</h2>
                            <p className="text-slate-500 mb-8 text-sm">
                                This will permanently erase your history, points, and vouchers. This action cannot be undone.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        notify.success('Account deletion request submitted. Our team will contact you within 48 hours.');
                                    }}
                                    className="w-full h-14 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                                >
                                    Yes, Delete My Account
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
