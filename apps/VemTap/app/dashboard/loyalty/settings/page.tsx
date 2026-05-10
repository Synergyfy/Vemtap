"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Bell, Zap, QrCode, Power, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoyaltySettingsPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-10">
            {/* System Status Section */}
            <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-primary/10 text-primary rounded-xl md:rounded-2xl shrink-0">
                            <Power size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900">System Status</h2>
                            <p className="text-xs md:text-sm text-gray-500">Enable or disable the loyalty system globally.</p>
                        </div>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary scale-110 md:scale-125" defaultChecked />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-5 md:pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <QrCode size={18} className="text-gray-400" />
                            <span className="text-xs md:text-sm font-semibold text-gray-700">QR Redemption</span>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-gray-400" />
                            <span className="text-xs md:text-sm font-semibold text-gray-700">Push Notifications</span>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </section>

            {/* General Rules Section */}
            <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="p-2 md:p-3 bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl shrink-0">
                        <Zap size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">General Rules</h2>
                        <p className="text-xs md:text-sm text-gray-500">Set global point ratios and limits.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs md:text-sm font-bold text-gray-700 ml-1">Default Points Ratio</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                                <Input 
                                    defaultValue="1000" 
                                    className="pl-8 h-11 md:h-12 rounded-xl border-gray-100 bg-gray-50/50 text-sm" 
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px] md:text-xs">= 10 pts</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs md:text-sm font-bold text-gray-700 ml-1">Daily Points Limit</Label>
                            <Input 
                                defaultValue="5000" 
                                className="h-11 md:h-12 rounded-xl border-gray-100 bg-gray-50/50 text-sm" 
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Shield size={18} className="text-gray-400 shrink-0" />
                            <div>
                                <p className="text-xs md:text-sm font-semibold text-gray-700">Fraud Protection</p>
                                <p className="text-[10px] md:text-xs text-gray-500">Automatically flag unusual activity.</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </section>

            <div className="flex justify-end gap-4">
                <Button variant="ghost" className="h-12 px-8 rounded-xl font-bold text-gray-500">
                    Discard Changes
                </Button>
                <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 gap-2">
                    <Save size={18} /> Save Settings
                </Button>
            </div>
        </div>
    );
}

