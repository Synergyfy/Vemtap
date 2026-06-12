'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationSettingsView() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Notification Preferences</h3>
                <div className="space-y-6">
                    {['Email Notifications', 'SMS Updates', 'Push Notifications'].map(n => (
                        <div key={n} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100">
                            <span className="text-sm font-bold text-gray-900">{n}</span>
                            <div className="h-6 w-11 bg-[#066CF4] rounded-full relative p-1">
                                <div className="size-4 bg-white rounded-full absolute right-1 shadow-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function SecuritySettingsView() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Security Settings</h3>
                <div className="space-y-4">
                    <Button variant="outline" className="w-full h-16 rounded-2xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">Change Password</Button>
                    <Button variant="outline" className="w-full h-16 rounded-2xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">Enable 2FA</Button>
                </div>
            </div>
        </div>
    );
}
