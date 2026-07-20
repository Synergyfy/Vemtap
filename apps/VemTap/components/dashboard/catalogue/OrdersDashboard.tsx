'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    ClipboardList, Clock, CheckCircle2, XCircle, 
    Calendar, Search, Filter, Phone, MessageSquare, 
    MoreVertical, ChevronRight, ArrowRight, User,
    MapPin, Smartphone, Star, Edit3, Trash2,
    Check, Play, Send, FileDown, Printer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export function OrdersOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black text-gray-900 leading-tight">Orders</h1>
                    <PageGuideButton />
                    <AICopilotButton />
                </div>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Manage and fulfill customer requests in real-time.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Search size={22} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Filter size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-[#066CF4] rounded-full border-2 border-white" />
                </Button>
                <Button variant="outline" className="h-10 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#066CF4]">
                    Share Ordering QR
                </Button>
            </div>
        </div>
    );
}

export function OrderStatusCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[140px] md:min-w-0 rounded-[24px] md:rounded-[32px] bg-white p-5 md:p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className={cn("size-10 rounded-xl flex items-center justify-center mb-4 shadow-sm", stat.bg)}>
                        <stat.icon size={20} className={stat.color} />
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function OrderListCard({ order }: { order: any }) {
    const statusColors: any = {
        'pending': 'bg-amber-50 text-amber-600',
        'confirmed': 'bg-blue-50 text-[#066CF4]',
        'processing': 'bg-purple-50 text-purple-600',
        'completed': 'bg-emerald-50 text-emerald-600',
        'cancelled': 'bg-red-50 text-red-600',
    };

    return (
        <div className="group relative p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-[18px] bg-gray-50 flex items-center justify-center font-black text-[#066CF4] text-xs shrink-0">
                        {order.ref.split('-')[1]}
                    </div>
                    <div>
                        <h4 className="text-base font-black text-gray-900">{order.customerName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {order.date} • {order.time}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={cn("border-none font-black text-[8px] uppercase px-3 py-1", statusColors[order.status.toLowerCase()])}>
                        {order.status}
                    </Badge>
                    <button className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Items Requested</p>
                <p className="text-sm font-bold text-gray-700 leading-relaxed">{order.items}</p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <button className="size-10 rounded-xl bg-blue-50 text-[#066CF4] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm">
                        <Phone size={16} />
                    </button>
                    <button className="size-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm">
                        <Smartphone size={16} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {order.status === 'Pending' && (
                        <Button className="h-10 px-6 rounded-xl bg-[#066CF4] text-[9px] font-black uppercase tracking-widest text-white active:scale-95 transition-all">
                            Confirm Order
                        </Button>
                    )}
                    {order.status === 'Confirmed' && (
                        <Button className="h-10 px-6 rounded-xl bg-emerald-500 text-[9px] font-black uppercase tracking-widest text-white active:scale-95 transition-all">
                            Mark Ready
                        </Button>
                    )}
                    <Link href={`/dashboard/catalogue/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] hover:bg-blue-50">
                            Details
                            <ArrowRight size={14} className="ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
