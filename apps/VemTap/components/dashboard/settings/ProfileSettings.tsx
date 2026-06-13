'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Building2, Globe, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileSettingsView({ business }: { business: any }) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* BUSINESS INFORMATION */}
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Business Information</h3>
                
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                    <div className="size-32 rounded-[32px] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:border-[#066CF4]/30 transition-all">
                        <Camera size={32} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Logo</span>
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <input defaultValue={business?.name} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900" placeholder="Business Name" />
                        <select className="w-full h-16 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900 appearance-none">
                            <option>{business?.category || 'Select Category'}</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <textarea defaultValue={business?.description} className="w-full min-h-[120px] bg-gray-50 border-none rounded-2xl p-6 text-sm font-bold text-gray-900" placeholder="Business Description..." />
                </div>
            </div>

            {/* CONTACT & LOCATION */}
            <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Contact & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input defaultValue={business?.phone} className="h-16 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900" placeholder="Phone Number" />
                    <input defaultValue={business?.email} className="h-16 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900" placeholder="Email Address" />
                    <input defaultValue={business?.website} className="h-16 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900" placeholder="Website" />
                    <input defaultValue={business?.address} className="h-16 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold text-gray-900" placeholder="Address" />
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-gray-400">Cancel</Button>
                <Button className="h-14 px-10 rounded-2xl bg-[#066CF4] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Save Changes</Button>
            </div>
        </div>
    );
}
