"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, 
    Search, Filter, Plus, ArrowLeft, ChevronRight,
    Users, Scissors, Star, MessageSquare, Phone,
    Smartphone, MoreVertical, LayoutGrid, List
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Spinner from '@/components/ui/Spinner';

export default function BookingsDashboardPage() {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const isLoading = false;

    const stats = [
        { label: "Today's Bookings", value: '14', icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: "Upcoming", value: '42', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: "Confirmed", value: '38', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: "Cancelled", value: '3', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    const mockBookings = [
        { id: '1', customer: 'Sarah Jenkins', service: 'Premium Haircut', date: 'Today', time: '02:00 PM', duration: '45m', status: 'Confirmed' },
        { id: '2', customer: 'Michael K.', service: 'Beard Trim & Style', date: 'Today', time: '03:15 PM', duration: '30m', status: 'Pending' },
        { id: '3', customer: 'Elena R.', service: 'Full Color Treatment', date: 'Tomorrow', time: '10:00 AM', duration: '2h', status: 'Confirmed' },
        { id: '4', customer: 'David W.', service: 'Quick Trim', date: 'Tomorrow', time: '12:30 PM', duration: '15m', status: 'Cancelled' },
    ];

    if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 leading-tight">Bookings</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">Manage your appointment schedule and service requests.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                   <button 
                       onClick={() => setViewMode('list')}
                       className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'list' ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600")}
                   >
                      <List size={14} className="inline mr-2" /> List
                   </button>
                   <button 
                       onClick={() => setViewMode('calendar')}
                       className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'calendar' ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600")}
                   >
                      <CalendarIcon size={14} className="inline mr-2" /> Calendar
                   </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className={cn("size-10 rounded-xl flex items-center justify-center mb-4 shadow-sm", s.bg)}>
                            <s.icon size={20} className={s.color} />
                        </div>
                        <p className="text-2xl font-black text-gray-900">{s.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Bookings List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Active Schedule</h3>
                   <Button variant="outline" className="h-10 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">Filter By Date</Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {mockBookings.map((bk) => (
                        <div key={bk.id} className="group p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-xl transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="size-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center shrink-0 border border-gray-100">
                                       <span className="text-[10px] font-black text-[#066CF4] uppercase">{bk.time.split(' ')[1]}</span>
                                       <span className="text-sm font-black text-gray-900">{bk.time.split(' ')[0]}</span>
                                    </div>
                                    <div>
                                       <h4 className="text-base font-black text-gray-900">{bk.customer}</h4>
                                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{bk.service} • {bk.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className={cn(
                                        "border-none font-black text-[8px] uppercase px-4 py-1.5",
                                        bk.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600" :
                                        bk.status === 'Pending' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                    )}>
                                        {bk.status}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                       <button className="size-10 rounded-xl bg-blue-50 text-[#066CF4] flex items-center justify-center hover:scale-110 transition-all"><Phone size={16} /></button>
                                       <button className="size-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:scale-110 transition-all"><Smartphone size={16} /></button>
                                       <button className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center"><MoreVertical size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-[40px] bg-gray-900 p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#066CF4]/20 rounded-full blur-2xl -mr-16 -mt-16" />
                    <h3 className="text-2xl font-black mb-4 leading-tight">Setup Booking <br /> Availability</h3>
                    <p className="text-sm font-medium text-white/50 mb-8">Configure your working hours, break times, and service limits.</p>
                    <Button className="h-14 px-8 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-widest text-white shadow-xl hover:bg-[#4293FF] transition-all">Configure Hours</Button>
                </div>
                <div className="rounded-[40px] bg-[#066CF4] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                    <h3 className="text-2xl font-black mb-4 leading-tight">Get More <br /> Appointments</h3>
                    <p className="text-sm font-medium text-white/80 mb-8">Share your specialized booking QR code on Instagram and Facebook.</p>
                    <Button className="h-14 px-8 rounded-2xl bg-white text-[#066CF4] font-black uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all">Share Booking QR</Button>
                </div>
            </div>
        </div>
    );
}
