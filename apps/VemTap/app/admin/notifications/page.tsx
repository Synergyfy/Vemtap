'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/services/notifications/hooks';
import AdminBroadcastComposer from '@/components/admin/notifications/AdminBroadcastComposer';
import AdminBroadcastHistoryTable from '@/components/admin/notifications/AdminBroadcastHistoryTable';
import AdminReminderTemplatesList from '@/components/admin/notifications/AdminReminderTemplatesList';
import {
    Bell,
    Send,
    FileText,
    Inbox,
    CheckCircle2,
    Info,
    AlertTriangle,
    Clock,
    Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

type ActiveTab = 'broadcasts' | 'templates' | 'inbox';

export default function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('broadcasts');

    // Inbox notifications
    const { data: notifications = [], isLoading: isInboxLoading } = useNotifications();
    const markReadMutation = useMarkAsRead();
    const markAllReadMutation = useMarkAllAsRead();

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="text-green-500" size={18} />;
            case 'warning':
                return <AlertTriangle className="text-orange-500" size={18} />;
            case 'info':
                return <Info className="text-blue-500" size={18} />;
            default:
                return <Bell className="text-gray-500" size={18} />;
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Top Page Header */}
            <PageHeader
                title="Notification & Broadcast Center"
                description="Push targeted alerts to all users, businesses, or customers, customize automated subscription renewal templates, and monitor platform logs."
            />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-200/70 backdrop-blur-sm rounded-2xl w-fit border border-gray-200">
                <button
                    onClick={() => setActiveTab('broadcasts')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        activeTab === 'broadcasts'
                            ? 'bg-white text-text-main shadow-sm'
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <Send size={15} className={activeTab === 'broadcasts' ? 'text-primary' : ''} />
                    Broadcast & Push Alerts
                </button>

                <button
                    onClick={() => setActiveTab('templates')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        activeTab === 'templates'
                            ? 'bg-white text-text-main shadow-sm'
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <FileText size={15} className={activeTab === 'templates' ? 'text-primary' : ''} />
                    Subscription Reminder Templates
                </button>

                <button
                    onClick={() => setActiveTab('inbox')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        activeTab === 'inbox'
                            ? 'bg-white text-text-main shadow-sm'
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <Inbox size={15} className={activeTab === 'inbox' ? 'text-primary' : ''} />
                    Admin Inbox Alerts
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab 1: Broadcast & Push Alerts */}
            {activeTab === 'broadcasts' && (
                <div className="space-y-8 animate-in fade-in duration-200">
                    <AdminBroadcastComposer />
                    <AdminBroadcastHistoryTable />
                </div>
            )}

            {/* Tab 2: Subscription Reminder Templates */}
            {activeTab === 'templates' && (
                <div className="animate-in fade-in duration-200">
                    <AdminReminderTemplatesList />
                </div>
            )}

            {/* Tab 3: Admin Inbox Alerts */}
            {activeTab === 'inbox' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in duration-200">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                                <Inbox className="text-primary" size={18} />
                                System Alerts & Administrative Notices
                            </h3>
                            <p className="text-xs text-text-secondary mt-0.5">
                                Direct notifications and system health alerts received by administrator accounts.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                markAllReadMutation.mutate(undefined, {
                                    onSuccess: () => toast.success('All notifications marked as read'),
                                });
                            }}
                            disabled={notifications.length === 0 || unreadCount === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-xs disabled:opacity-50"
                        >
                            <CheckCircle2 size={15} />
                            Mark All Read
                        </button>
                    </div>

                    {isInboxLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-3">
                            <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent"></div>
                            <p className="text-xs text-text-secondary font-medium">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                                <Bell size={32} />
                            </div>
                            <h4 className="text-base font-bold text-text-main mb-1">No alerts yet</h4>
                            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                                Platform alerts, system notices, and urgent warnings for admins will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((note) => (
                                <div
                                    key={note.id}
                                    onClick={() => !note.read && markReadMutation.mutate(note.id)}
                                    className={`p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                        !note.read ? 'bg-primary/5' : ''
                                    }`}
                                >
                                    <div className="mt-1">{getIcon(note.type)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <h4
                                                className={`text-sm ${
                                                    !note.read ? 'font-bold text-text-main' : 'text-text-secondary'
                                                }`}
                                            >
                                                {note.title}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary font-medium">
                                                <Clock size={12} />
                                                {new Date(note.timestamp).toLocaleDateString()} at{' '}
                                                {new Date(note.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                                            {note.message}
                                        </p>
                                        {!note.read && (
                                            <button
                                                className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markReadMutation.mutate(note.id);
                                                }}
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                    {!note.read && (
                                        <div className="mt-1.5 size-2 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
