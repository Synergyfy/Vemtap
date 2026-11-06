'use client';

import React, { useState } from 'react';
import { useSendAdminBroadcast } from '@/services/notifications/hooks';
import { TargetAudience } from '@/services/notifications/types';
import {
    Send,
    Users,
    Store,
    UserCheck,
    Shield,
    Bell,
    Smartphone,
    Globe,
    AlertCircle,
    Info,
    AlertTriangle,
    Sparkles,
    Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminBroadcastComposerProps {
    onSuccess?: () => void;
}

export default function AdminBroadcastComposer({ onSuccess }: AdminBroadcastComposerProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState<TargetAudience>('ALL');
    const [type, setType] = useState<string>('announcement');
    const [actionUrl, setActionUrl] = useState('');
    const [sendPush, setSendPush] = useState(true);
    const [sendInApp, setSendInApp] = useState(true);

    const sendBroadcastMutation = useSendAdminBroadcast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Please enter a notification title');
            return;
        }
        if (!message.trim()) {
            toast.error('Please enter a notification message');
            return;
        }
        if (!sendInApp && !sendPush) {
            toast.error('Please select at least one delivery channel (In-App or Push)');
            return;
        }

        sendBroadcastMutation.mutate(
            {
                title: title.trim(),
                message: message.trim(),
                targetAudience,
                type,
                actionUrl: actionUrl.trim() || undefined,
                sendPush,
                sendInApp,
            },
            {
                onSuccess: (res: any) => {
                    toast.success(
                        `Notification pushed successfully! (${res?.totalRecipients ?? 0} in-app, ${res?.pushRecipients ?? 0} push)`,
                        { duration: 5000 },
                    );
                    setTitle('');
                    setMessage('');
                    setActionUrl('');
                    onSuccess?.();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || 'Failed to push notification');
                },
            },
        );
    };

    const audienceOptions = [
        {
            id: 'ALL' as TargetAudience,
            label: 'All Platform Users',
            description: 'Businesses, Customers, & Staff',
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        },
        {
            id: 'BUSINESSES' as TargetAudience,
            label: 'Businesses Only',
            description: 'Owners, Managers, & Staff',
            icon: Store,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        },
        {
            id: 'CUSTOMERS' as TargetAudience,
            label: 'Customers Only',
            description: 'End consumers & shoppers',
            icon: UserCheck,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
        },
        {
            id: 'AGENTS' as TargetAudience,
            label: 'Affiliate Agents',
            description: 'Affiliate partner network',
            icon: Shield,
            color: 'text-purple-600 bg-purple-50 border-purple-200',
        },
    ];

    const typeOptions = [
        { id: 'announcement', label: 'Announcement', icon: Sparkles, color: 'text-indigo-600' },
        { id: 'info', label: 'Info Update', icon: Info, color: 'text-blue-600' },
        { id: 'warning', label: 'Important Alert', icon: AlertTriangle, color: 'text-amber-600' },
        { id: 'promo', label: 'Promotion / Offer', icon: Sparkles, color: 'text-emerald-600' },
        { id: 'error', label: 'Urgent Notice', icon: AlertCircle, color: 'text-red-600' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Composer (2 columns on desktop) */}
            <form
                onSubmit={handleSubmit}
                className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6"
            >
                <div>
                    <h3 className="text-lg font-bold text-text-main mb-1 flex items-center gap-2">
                        <Send className="text-primary" size={20} />
                        Compose & Push Notification
                    </h3>
                    <p className="text-xs text-text-secondary">
                        Send immediate real-time push alerts and in-app notifications directly to user devices.
                    </p>
                </div>

                {/* 1. Target Audience Selection */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
                        1. Select Target Audience
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {audienceOptions.map((aud) => {
                            const Icon = aud.icon;
                            const isSelected = targetAudience === aud.id;
                            return (
                                <button
                                    key={aud.id}
                                    type="button"
                                    onClick={() => setTargetAudience(aud.id)}
                                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                                        isSelected
                                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                    }`}
                                >
                                    <div
                                        className={`size-9 rounded-lg flex items-center justify-center shrink-0 border ${aud.color}`}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-main truncate">{aud.label}</p>
                                        <p className="text-[11px] text-text-secondary truncate mt-0.5">
                                            {aud.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Notification Details */}
                <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                        2. Notification Content
                    </label>

                    {/* Title */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-text-main">Notification Title</span>
                            <span className="text-[11px] text-gray-400">{title.length}/100</span>
                        </div>
                        <input
                            type="text"
                            maxLength={100}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Weekend Flash Sale & System Updates"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Message Body */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-text-main">Message Body</span>
                            <span className="text-[11px] text-gray-400">{message.length}/500</span>
                        </div>
                        <textarea
                            rows={4}
                            maxLength={500}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write the full notification message here. Be concise and actionable..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                            required
                        />
                    </div>

                    {/* Notification Type & Deep Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-main mb-1.5">Alert Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            >
                                {typeOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
                                <LinkIcon size={13} className="text-gray-400" />
                                Action URL / Deep Link (Optional)
                            </label>
                            <input
                                type="text"
                                value={actionUrl}
                                onChange={(e) => setActionUrl(e.target.value)}
                                placeholder="e.g., /dashboard/deals or /pricing"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Delivery Channels */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
                        3. Delivery Channels
                    </label>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-all select-none">
                            <input
                                type="checkbox"
                                checked={sendPush}
                                onChange={(e) => setSendPush(e.target.checked)}
                                className="size-4 rounded text-primary focus:ring-primary accent-primary"
                            />
                            <div className="flex items-center gap-2">
                                <Smartphone size={16} className="text-primary" />
                                <span className="text-xs font-bold text-text-main">Web Push Notifications</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-all select-none">
                            <input
                                type="checkbox"
                                checked={sendInApp}
                                onChange={(e) => setSendInApp(e.target.checked)}
                                className="size-4 rounded text-primary focus:ring-primary accent-primary"
                            />
                            <div className="flex items-center gap-2">
                                <Bell size={16} className="text-primary" />
                                <span className="text-xs font-bold text-text-main">In-App Inbox Alerts</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <Globe size={14} className="text-gray-400" />
                        Targeting:{' '}
                        <span className="font-bold text-text-main">
                            {audienceOptions.find((a) => a.id === targetAudience)?.label}
                        </span>
                    </p>

                    <button
                        type="submit"
                        disabled={sendBroadcastMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 text-sm"
                    >
                        {sendBroadcastMutation.isPending ? (
                            <>
                                <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
                                Broadcasting...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Push Notification
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Live Interactive Preview Card (1 column on desktop) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-5 h-fit sticky top-6">
                <div>
                    <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                        <Smartphone className="text-primary" size={16} />
                        Live Device Preview
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                        Preview how recipients will see your push alert and in-app card.
                    </p>
                </div>

                {/* OS Push Notification Banner Preview */}
                <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Web Push Preview (Lockscreen / Top Banner)
                    </span>
                    <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-xl border border-gray-800 flex items-start gap-3">
                        <div className="size-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                            <Bell size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-[11px] font-bold text-gray-300">VemTap Platform</span>
                                <span className="text-[10px] text-gray-500">Just now</span>
                            </div>
                            <p className="text-xs font-bold text-white truncate">
                                {title || 'Notification Title'}
                            </p>
                            <p className="text-xs text-gray-300 line-clamp-2 mt-0.5 leading-relaxed">
                                {message || 'Your notification message body will appear here on recipients devices...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* In-App Notification Card Preview */}
                <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        In-App Notification Feed Preview
                    </span>
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Sparkles size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h5 className="text-xs font-bold text-text-main truncate">
                                    {title || 'Announcement Title'}
                                </h5>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary">
                                    {type}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                                {message || 'In-app notification message preview...'}
                            </p>
                            {actionUrl && (
                                <p className="mt-2 text-[11px] font-bold text-primary flex items-center gap-1">
                                    <LinkIcon size={11} /> {actionUrl}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
