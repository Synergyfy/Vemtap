"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, CheckCircle2, Zap, Smartphone, 
    MessageSquare, Mail, Search, Filter, 
    ArrowLeft, ChevronRight, Activity, 
    ShieldCheck, Calendar, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AutomationLogsPage() {
    const logs = [
        { id: '1', time: '10:45 AM', date: 'Today', automation: 'Welcome Message', user: 'Sarah Jenkins', action: 'WhatsApp Sent', status: 'success' },
        { id: '2', time: '09:20 AM', date: 'Today', automation: 'Birthday Reward', user: 'Michael K.', action: 'Coupon Generated', status: 'success' },
        { id: '3', time: '08:15 AM', date: 'Today', automation: '30-Day Reactivation', user: 'Elena R.', action: 'SMS Sent', status: 'success' },
        { id: '4', time: 'Yesterday', date: 'Oct 24', automation: 'Welcome Message', user: 'David Wilson', action: 'WhatsApp Sent', status: 'failed', error: 'Invalid Number' },
        { id: '5', time: 'Yesterday', date: 'Oct 24', automation: 'Custom Workflow', user: 'James T.', action: 'Tag Added: VIP', status: 'success' },
    ];

    return (
        <div className="pb-32 md:pb-20 max-w-7xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/automations" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Center
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 leading-tight">Activity Logs</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Track every automated action in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="outline" className="h-12 rounded-xl border-gray-100 font-black text-[10px] uppercase tracking-widest">
                      <Filter size={16} className="mr-2" />
                      Filter
                   </Button>
                </div>
            </div>

            {/* TIMELINE VIEW */}
            <div className="space-y-4 relative before:absolute before:left-[27px] before:top-8 before:bottom-0 before:w-0.5 before:bg-gray-100">
                {logs.map((log, i) => (
                    <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative z-10 flex gap-6"
                    >
                        <div className={cn(
                            "size-14 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center shrink-0",
                            log.status === 'success' ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
                        )}>
                            {log.status === 'success' ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}
                        </div>

                        <div className="flex-1 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-xl hover:shadow-black/5 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Badge className="bg-blue-50 text-[#066CF4] border-none font-black text-[8px] uppercase px-2 mb-2">
                                        {log.automation}
                                    </Badge>
                                    <h4 className="text-base font-black text-gray-900">{log.action}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-900">{log.time}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{log.date}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                               <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center font-black text-[10px] text-gray-400">
                                     {log.user.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span className="text-xs font-bold text-gray-600">{log.user}</span>
                               </div>
                               {log.error ? (
                                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">{log.error}</span>
                               ) : (
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                               )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Load Older Logs</Button>
            </div>
        </div>
    );
}
