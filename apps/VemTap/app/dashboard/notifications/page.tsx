'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/services/notifications/hooks';
import { Notification } from '@/services/notifications/types';
import { Bell, CheckCircle2, Info, AlertTriangle, Clock, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const { data: notifications, isLoading } = useNotifications();
    const readMutation = useMarkAsRead();
    const readAllMutation = useMarkAllAsRead();

    const handleMarkAsRead = (id: string) => {
        readMutation.mutate(id);
    };

    const handleMarkAllRead = () => {
        readAllMutation.mutate(undefined, {
            onSuccess: () => {
                toast.success('All notifications marked as read');
            }
        });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-orange-500" size={20} />;
            case 'error': return <AlertTriangle className="text-red-500" size={20} />;
            case 'info': return <Info className="text-blue-500" size={20} />;
            default: return <Bell className="text-gray-500" size={20} />;
        }
    };

    const notificationList = notifications || [];

    return (
        <div className="p-8">
            <PageHeader
                title="Notifications"
                description="Stay updated with your business activity and platform alerts"
                actions={
                    <button
                        onClick={handleMarkAllRead}
                        disabled={notificationList.length === 0 || readAllMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-xs disabled:opacity-50"
                    >
                        <CheckCircle2 size={16} />
                        Mark All Read
                    </button>
                }
            />

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <p className="text-sm text-text-secondary font-medium">Loading notifications...</p>
                    </div>
                ) : notificationList.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Bell className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-text-main mb-1">No notifications yet</h3>
                        <p className="text-sm text-text-secondary max-w-xs">
                            When you have new activity or alerts, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notificationList.map((note: Notification) => (
                            <div
                                key={note.id}
                                onClick={() => !note.read && handleMarkAsRead(note.id)}
                                className={`p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!note.read ? 'bg-primary/5' : ''}`}
                            >
                                <div className="mt-1">{getIcon(note.type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <h4 className={`text-sm ${!note.read ? 'font-bold text-text-main' : 'text-text-secondary'}`}>
                                            {note.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-medium">
                                            <Clock size={12} />
                                            {new Date(note.timestamp).toLocaleDateString()} at {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
                                        {note.message}
                                    </p>
                                    {!note.read && (
                                        <button
                                            className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(note.id);
                                            }}
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                                {!note.read && (
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

