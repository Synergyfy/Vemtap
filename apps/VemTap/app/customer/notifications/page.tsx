'use client';

import React from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, Clock, Trash2, ArrowLeft, MoreHorizontal, Gift, Star, Zap } from 'lucide-react';
import { notify } from '@/lib/notify';
import Link from 'next/link';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/services/notifications/hooks';
import { Notification } from '@/services/notifications/types';

export default function CustomerNotificationsPage() {
    const { data: notifications = [], isLoading } = useNotifications();
    const readMutation = useMarkAsRead();
    const readAllMutation = useMarkAllAsRead();

    const handleReadAll = () => {
        readAllMutation.mutate(undefined, {
            onSuccess: () => notify.success('Platform cleared: All alerts marked as read')
        });
    };

    const getIcon = (type: string, title: string) => {
        if (title.toLowerCase().includes('reward')) return <Gift size={20} className="text-orange-500" />;
        if (title.toLowerCase().includes('point')) return <Star size={20} className="text-yellow-500" />;
        if (title.toLowerCase().includes('check-in')) return <Zap size={20} className="text-blue-500" />;

        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-orange-500" size={20} />;
            case 'info': return <Info className="text-blue-500" size={20} />;
            default: return <Bell className="text-gray-500" size={20} />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">

            {/* Unified Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <Link
                        href="/customer/dashboard"
                        className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-text-main tracking-tight">Alert Center</h1>
                        <p className="text-sm text-text-secondary font-medium mt-1">Updates on your rewards, visits, and special offers.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReadAll}
                        disabled={notifications.length === 0}
                        className="h-12 px-6 bg-white border border-gray-200 text-text-main font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        Clear Inbox
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg shadow-primary/20 relative"></div>
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-text-secondary animate-pulse">Syncing Alerts...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-32 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center mb-6 shadow-inner">
                            <Bell className="text-gray-300" size={40} />
                        </div>
                        <h3 className="text-xl font-display font-bold text-text-main mb-2">Peace & Quiet</h3>
                        <p className="text-sm text-text-secondary max-w-xs mx-auto font-medium">
                            You're all caught up! No new notifications for now. We'll alert you when a premium reward is ready.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((note: Notification) => (
                            <div
                                key={note.id}
                                onClick={() => !note.read && readMutation.mutate(note.id)}
                                className={`p-8 flex items-start gap-6 hover:bg-gray-50/50 transition-all cursor-pointer relative group ${!note.read ? 'bg-primary/2' : ''}`}
                            >
                                {/* Unread indicator bar */}
                                {!note.read && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-full" />
                                )}

                                <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-500 ${!note.read ? 'bg-white border border-primary/20' : 'bg-gray-50 grayscale'
                                    }`}>
                                    {getIcon(note.type, note.title)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <h4 className={`text-base truncate ${!note.read ? 'font-display font-bold text-text-main' : 'text-text-secondary font-medium'}`}>
                                            {note.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-black uppercase tracking-widest shrink-0">
                                            <Clock size={12} className="text-primary" />
                                            {new Date(note.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p className={`text-sm leading-relaxed max-w-2xl ${!note.read ? 'text-text-main font-medium opacity-80' : 'text-text-secondary opacity-60'}`}>
                                        {note.message}
                                    </p>

                                    {!note.read && (
                                        <div className="mt-4 flex gap-4">
                                            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View Details</button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    readMutation.mutate(note.id);
                                                }}
                                                className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-main"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!note.read && (
                                    <div className="mt-2 shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 shadow-sm shadow-primary/40 animate-pulse"></div>
                                    </div>
                                )}

                                <div className="absolute right-8 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-300 hover:text-text-main transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Engagement Card */}
            <div className="bg-linear-to-r from-primary to-blue-600 rounded-lg p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-display font-bold mb-2">Missed an alert?</h3>
                        <p className="text-blue-100 font-medium max-w-sm">Enable push notifications on your mobile device to never miss a premium voucher or check-in verification.</p>
                    </div>
                    <button className="h-14 px-8 bg-white text-primary font-black uppercase tracking-widest text-xs rounded-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 whitespace-nowrap">
                        Customize Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
