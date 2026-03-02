'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminNotificationsApi } from '@/lib/api/admin';
import { Bell, CheckCircle2, Info, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type AdminNotification = {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    createdAt: string;
};

export default function AdminNotificationsPage() {
    const queryClient = useQueryClient();
    const { data: notifications = [], isLoading } = useQuery<AdminNotification[]>({
        queryKey: ['admin-notifications'],
        queryFn: async () => {
            const response = await adminNotificationsApi.getAll();
            return (Array.isArray(response) ? response : response?.data || []) as AdminNotification[];
        },
    });

    const readMutation = useMutation({
        mutationFn: adminNotificationsApi.markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
    });

    const readAllMutation = useMutation({
        mutationFn: adminNotificationsApi.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            toast.success('All notifications marked as read');
        }
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-orange-500" size={20} />;
            case 'info': return <Info className="text-blue-500" size={20} />;
            default: return <Bell className="text-gray-500" size={20} />;
        }
    };

    return (
        <div className="p-8">
            <PageHeader
                title="Platform Notifications"
                description="System-wide alerts and updates for platform administrators"
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => readAllMutation.mutate()}
                            disabled={notifications.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-xs disabled:opacity-50"
                        >
                            <CheckCircle2 size={16} />
                            Mark All Read
                        </button>
                        <button
                            onClick={() => {
                                toast('Clear history is not available from backend yet.');
                            }}
                            disabled={notifications.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all text-xs disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            Clear History
                        </button>
                    </div>
                }
            />

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <p className="text-sm text-text-secondary font-medium">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Bell className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-text-main mb-1">No notifications yet</h3>
                        <p className="text-sm text-text-secondary max-w-xs">
                            Platform alerts and system notifications will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((note) => (
                            <div
                                key={note.id}
                                onClick={() => !note.isRead && readMutation.mutate(note.id)}
                                className={`p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!note.isRead ? 'bg-primary/5' : ''}`}
                            >
                                <div className="mt-1">{getIcon(note.type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <h4 className={`text-sm ${!note.isRead ? 'font-bold text-text-main' : 'text-text-secondary'}`}>
                                            {note.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-medium">
                                            <Clock size={12} />
                                            {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
                                        {note.message}
                                    </p>
                                    {!note.isRead && (
                                        <button
                                            className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                readMutation.mutate(note.id);
                                            }}
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                                {!note.isRead && (
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
