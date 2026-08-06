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
import { useCatalogueOrders } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function BookingsDashboardPage() {
    const { activeBranchId } = useActiveBranch();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    
    const { data: bookingsData, isLoading } = useCatalogueOrders({ 
        type: 'booking', 
        branchId: activeBranchId || undefined 
    });

    const bookings = bookingsData?.data || [];

    const todayStr = new Date().toISOString().split('T')[0];
    
    const todayBookingsCount = bookings.filter((b: any) => b.bookingDate === todayStr).length;
    const upcomingBookingsCount = bookings.filter((b: any) => b.bookingDate && b.bookingDate > todayStr).length;
    const confirmedCount = bookings.filter((b: any) => b.status === 'completed' || b.status === 'processing').length;
    const cancelledCount = bookings.filter((b: any) => b.status === 'cancelled' || b.status === 'rejected').length;

    const stats = [
        { label: "Today's Bookings", value: todayBookingsCount.toString(), icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: "Upcoming", value: upcomingBookingsCount.toString(), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: "Confirmed", value: confirmedCount.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: "Cancelled", value: cancelledCount.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

    return (
        <div className="pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2"><h1 className="text-3xl font-black text-gray-900 leading-tight">Bookings</h1><PageGuideButton /><AICopilotButton /></div>
                    <p className="text-sm font-medium text-gray-500 mt-1">Manage your appointment schedule and service requests.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                   <button 
                       onClick={() => setViewMode('list')}
                       className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer", viewMode === 'list' ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600")}
                   >
                      <List size={14} className="inline mr-2" /> List
                   </button>
                   <button 
                       onClick={() => setViewMode('calendar')}
                       className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer", viewMode === 'calendar' ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600")}
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
                    {bookings.map((bk: any) => {
                        const timeParts = (bk.bookingTime || '12:00 PM').split(' ');
                        const timeStr = timeParts[0] || '12:00';
                        const periodStr = timeParts[1] || 'PM';
                        const customerName = bk.customer ? `${bk.customer.firstName} ${bk.customer.lastName}`.trim() : 'Walk-in Customer';
                        const servicesList = bk.items?.map((i: any) => i.item?.name || i.name || 'Service Item').join(', ') || 'No Services Selected';
                        
                        return (
                            <div key={bk.id} className="group p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-xl transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="size-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center shrink-0 border border-gray-100">
                                           <span className="text-[10px] font-black text-[#066CF4] uppercase">{periodStr}</span>
                                           <span className="text-sm font-black text-gray-900">{timeStr}</span>
                                        </div>
                                        <div>
                                           <h4 className="text-base font-black text-gray-900">{customerName}</h4>
                                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{servicesList} • {bk.bookingDate || 'No Date'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={cn(
                                            "border-none font-black text-[8px] uppercase px-4 py-1.5",
                                            bk.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                                            bk.status === 'processing' ? "bg-blue-50 text-blue-600" :
                                            bk.status === 'new' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {bk.status === 'completed' ? 'Confirmed' : bk.status === 'processing' ? 'Active' : bk.status === 'new' ? 'Pending' : bk.status}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                           {bk.customer?.phone && (
                                               <>
                                                   <a href={`tel:${bk.customer.phone}`} className="size-10 rounded-xl bg-blue-50 text-[#066CF4] flex items-center justify-center hover:scale-110 transition-all cursor-pointer"><Phone size={16} /></a>
                                                   <a href={`https://wa.me/${bk.customer.phone}`} target="_blank" rel="noreferrer" className="size-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:scale-110 transition-all cursor-pointer"><Smartphone size={16} /></a>
                                               </>
                                           )}
                                           <Link href={`/dashboard/catalogue/orders/${bk.id}`} className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:text-primary transition-all"><MoreVertical size={16} /></Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {bookings.length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
                           <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                              <CalendarIcon size={40} />
                           </div>
                           <h4 className="text-lg font-black text-gray-900 mb-2">No bookings found</h4>
                           <p className="text-sm font-medium text-gray-400">Your branch schedule is currently clear.</p>
                        </div>
                    )}
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
