'use client';

import React, { useState, useEffect } from 'react';
import { notify } from '@/lib/notify';
import { User, Mail, Phone, Bell, Shield, Trash2, Camera, Check, LogOut, ChevronRight, Laptop, Smartphone, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useRouter } from 'next/navigation';

export default function CustomerSettingsPage() {
    const { user, logout, updateUser } = useAuthStore();
    const { profiles, fetchLoyaltyProfile } = useLoyaltyStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');

    // TODO: This should eventually come from a 'current business context' or 'last visited'
    const branchId = 'bistro_001';
    const profile = profiles[branchId];

    useEffect(() => {
        if (user?.id) {
            fetchLoyaltyProfile(user.id, branchId);
        }
    }, [user, branchId, fetchLoyaltyProfile]);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const result = await updateUser({ name, phone });
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

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase()
        : 'JAN 24';

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 p-4 md:p-0">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main tracking-tight">Identity Center</h1>
                    <p className="text-text-secondary font-medium mt-1">Manage your digital presence and privacy preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Navigation/Profile Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm text-center relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-24 bg-linear-to-r from-primary/10 to-blue-500/10"></div>

                        <div className="relative mt-4 mb-6 inline-block">
                            <div className="w-24 h-24 rounded-lg bg-white shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary">
                                    <User size={40} />
                                </div>
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg hover:scale-110 transition-all">
                                <Camera size={16} />
                            </button>
                        </div>

                        <h2 className="text-xl font-display font-bold text-text-main">{user?.name || 'Customer'}</h2>
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary mt-1 capitalize">{profile?.tierLevel || 'Bronze'} Member</p>

                        <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Loyalty</p>
                                <p className="text-lg font-bold text-primary">LVL {profile?.tierLevel === 'bronze' ? 1 : profile?.tierLevel === 'silver' ? 2 : profile?.tierLevel === 'gold' ? 3 : 4}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100"></div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Joined</p>
                                <p className="text-lg font-bold text-text-main">{joinedDate}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                        {[
                            { id: 'profile', label: 'Identity Profile', icon: User, active: true },
                            { id: 'security', label: 'Security & Privacy', icon: Shield },
                            { id: 'notifications', label: 'Alert Preferences', icon: Bell },
                            { id: 'devices', label: 'Linked Devices', icon: Laptop },
                        ].map((item) => (
                            <button
                                key={item.id}
                                className={`w-full flex items-center justify-between px-6 py-4 text-sm font-bold transition-all ${item.active ? 'bg-primary/5 text-primary border-r-4 border-primary' : 'text-text-secondary hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} />
                                    {item.label}
                                </div>
                                <ChevronRight size={16} className={item.active ? 'opacity-100' : 'opacity-30'} />
                            </button>
                        ))}
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="w-full h-14 bg-red-50 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100/50 active:scale-95"
                    >
                        <LogOut size={16} />
                        Terminate Session
                    </button>
                </div>

                {/* Right Column: Active Form */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Profile Details */}
                    <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>

                        <h3 className="text-lg font-display font-bold text-text-main mb-8 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                                    <User size={12} className="text-primary" />
                                    Legal Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-14 px-5 border border-gray-200 rounded-lg text-sm font-bold bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                                    <Mail size={12} className="text-primary" />
                                    Email Domain
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full h-14 px-5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-100/50 text-text-secondary focus:outline-none transition-all outline-none cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                                    <Phone size={12} className="text-primary" />
                                    Mobile Verification
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full h-14 px-5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-gray-50">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-display font-bold text-text-main flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                    Alert Matrix
                                </h3>
                            </div>
                            <div className="space-y-5">
                                {[
                                    { label: 'Reward Unlocked Notifications', desc: 'Alert me instantly when a voucher is ready for use', checked: true },
                                    { label: 'Activity Summaries', desc: 'Weekly digest of my check-ins and savings', checked: true },
                                    { label: 'SMS Security Alerts', desc: 'Notice for logins from unrecognized devices', checked: false },
                                ].map((pref, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-all cursor-pointer group">
                                        <div>
                                            <p className="font-bold text-sm text-text-main">{pref.label}</p>
                                            <p className="text-xs text-text-secondary font-medium">{pref.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={pref.checked} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-lg hover:bg-primary-hover transition-all shadow-2xl shadow-primary/30 active:scale-95 flex items-center justify-center gap-3"
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
                    <div className="bg-red-50/50 border-2 border-dashed border-red-100 rounded-lg p-6 md:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6 text-red-800">
                                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-display font-bold">Data Purge Protocol</h3>
                            </div>
                            <p className="text-sm text-red-700/80 mb-8 font-medium leading-relaxed max-w-xl text-balance">
                                Initiating an account deletion will permanently erase your check-in history, earned points, and active vouchers from the VemTap decentralized ledger. This action is irreversible.
                            </p>
                            <button className="h-14 px-8 border-2 border-red-200 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 shadow-lg shadow-red-200/50">
                                Request Account Termination
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
