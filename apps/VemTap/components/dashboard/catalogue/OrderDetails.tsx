'use client';

import React, { useState } from 'react';
import { 
    Phone, Mail, MessageSquare, Calendar, 
    ChevronRight, MapPin, Star, Clock, 
    ShoppingBag, Info, User, Tag, Edit3,
    ArrowRight, CheckCircle2, ShieldCheck,
    MoreHorizontal, Smartphone, MoreVertical,
    Check, Play, Send, FileDown, Printer, XCircle,
    RotateCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function OrderDetailsSummary({ order }: { order: any }) {
    const orderRef = order.ref || `ORD-${order.id?.slice(0, 8).toUpperCase()}`;
    const displayStatus = order.status === 'new' ? 'Pending' : order.status === 'processing' ? 'Active' : order.status === 'completed' ? 'Completed' : order.status;
    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const formattedTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

    return (
        <div className="rounded-[48px] bg-white p-8 md:p-10 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="size-32 rounded-[40px] bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center font-black text-4xl shadow-2xl border-[6px] border-white shrink-0">
                        {orderRef.split('-')[1] || 'ORD'}
                    </div>
                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black text-gray-900 uppercase">{orderRef}</h1>
                            <Badge className={cn(
                                "border-none font-black text-[10px] uppercase px-3 py-1 w-fit mx-auto md:mx-0",
                                order.status === 'new' ? "bg-amber-100 text-amber-600" :
                                order.status === 'processing' ? "bg-blue-100 text-blue-600" :
                                order.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                            )}>
                                {displayStatus}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm font-medium text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                {formattedDate}
                            </div>
                            <div className="hidden md:block size-1 rounded-full bg-gray-200" />
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} />
                                {formattedTime} {order.tableNumber ? `(Table: ${order.tableNumber})` : '(Digital Order)'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                   <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-gray-50 text-gray-400"><Printer size={22} /></Button>
                   <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-gray-50 text-gray-400"><FileDown size={22} /></Button>
                </div>
            </div>
        </div>
    );
}

export function OrderCustomerCard({ customer }: { customer: any }) {
    const name = customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : 'Walk-in Customer';
    
    return (
        <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="size-16 rounded-[22px] bg-gray-900 text-white flex items-center justify-center font-black text-xl italic shadow-lg shrink-0">
                        {name?.[0] || 'C'}
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-black text-gray-900">{name}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {customer ? 'Loyalty Member' : 'Guest'}
                        </p>
                        
                        {customer && (
                            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                                {[
                                    { icon: Phone, label: 'Call', color: 'bg-blue-50 text-blue-600', href: `tel:${customer.phone}` },
                                    { icon: MessageSquare, label: 'SMS', color: 'bg-purple-50 text-purple-600', href: `sms:${customer.phone}` },
                                    { icon: Smartphone, label: 'WhatsApp', color: 'bg-green-50 text-green-600', href: `https://wa.me/${customer.phone}` },
                                    { icon: Mail, label: 'Email', color: 'bg-emerald-50 text-emerald-600', href: `mailto:${customer.email}` },
                                ].map((act) => (
                                    <a key={act.label} href={act.href} target="_blank" rel="noreferrer" className={cn("size-12 rounded-xl flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer", act.color)}>
                                        <act.icon size={20} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                {customer && (
                    <Link href={`/dashboard/visitors/${customer.id}`}>
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#066CF4] cursor-pointer">
                            View CRM Profile <ArrowRight size={14} className="ml-2" />
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}

export function OrderItemsList({ items = [] }: { items: any[] }) {
    const totalAmount = items.reduce((acc, item) => acc + (Number(item.priceAtOrder || item.price || 0) * (item.quantity || 1)), 0);
    
    return (
        <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Order Items</h3>
            <div className="space-y-6">
                {items.map((item, i) => {
                    const price = Number(item.priceAtOrder || item.price || 0);
                    const name = item.item?.name || item.offer?.name || item.name || 'Item';
                    const image = item.item?.mainImage || item.offer?.mainImage || item.image || '';

                    return (
                        <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-50 group hover:bg-white hover:border-gray-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center shrink-0 border border-gray-100">
                                    {image ? <img src={image} className="size-full object-cover" /> : <ShoppingBag className="text-gray-300" />}
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-gray-900">{name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400">Quantity: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="text-lg font-black text-gray-900">₦{price.toLocaleString()}</p>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-10 pt-8 border-t border-gray-50 flex justify-between items-center">
                <span className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Total Amount</span>
                <span className="text-4xl font-black text-gray-900">₦{totalAmount.toLocaleString()}</span>
            </div>
        </div>
    );
}

export function OrderTimeline({ status, orderCreatedAt }: { status: string; orderCreatedAt?: string }) {
    const formattedSubmitTime = orderCreatedAt ? new Date(orderCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
    
    const steps = [
        { label: 'Request Submitted', time: formattedSubmitTime, active: true },
        { label: 'Order Confirmed', time: ['processing', 'completed'].includes(status) ? 'Confirmed' : '--:--', active: ['processing', 'completed'].includes(status) },
        { label: 'Processing', time: '--:--', active: ['processing', 'completed'].includes(status) },
        { label: 'Completed', time: '--:--', active: status === 'completed' },
    ];

    return (
        <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-10 text-center">Order Journey</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 relative">
                <div className="absolute left-[19px] md:left-10 md:top-5 top-0 bottom-0 md:bottom-auto md:right-10 md:h-0.5 w-0.5 md:w-auto bg-gray-100" />
                
                {steps.map((step, i) => (
                    <div key={i} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1 relative z-10 w-full md:w-auto">
                        <div className={cn(
                            "size-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0",
                            step.active ? "bg-[#066CF4]" : "bg-gray-200"
                        )}>
                            {step.active ? <Check size={16} className="text-white" /> : <Clock size={16} className="text-gray-400" />}
                        </div>
                        <div className="text-left md:text-center">
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", step.active ? "text-gray-900" : "text-gray-400")}>{step.label}</p>
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">{step.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function OrderManagementActions({ status, onStatusChange, isPending, onRefund }: { status: string; onStatusChange: (status: string) => void; isPending?: boolean; onRefund?: () => void }) {
    const displayStatus = status === 'new' ? 'Pending' : status === 'processing' ? 'Active' : status === 'completed' ? 'Completed' : status;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-[calc(100%-48px)] max-w-2xl bg-gray-900 p-4 rounded-[32px] shadow-2xl flex items-center gap-4 md:bottom-10">
            <div className="hidden md:block px-6 border-r border-white/10 shrink-0">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Status</p>
               <p className="text-sm font-black text-white">{displayStatus}</p>
            </div>
            
            <div className="flex-1 flex gap-3">
                {status === 'new' && (
                    <Button 
                        disabled={isPending}
                        onClick={() => onStatusChange('processing')} 
                        className="h-14 flex-1 rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                    >
                        Confirm Request
                    </Button>
                )}
                {status === 'processing' && (
                    <Button 
                        disabled={isPending}
                        onClick={() => onStatusChange('completed')} 
                        className="h-14 flex-1 rounded-2xl bg-emerald-500 text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                    >
                        Mark Completed
                    </Button>
                )}
                {status === 'completed' && onRefund && (
                    <Button 
                        disabled={isPending}
                        onClick={onRefund}
                        className="h-14 flex-1 rounded-2xl bg-amber-500 text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                    >
                        <RotateCcw size={16} className="mr-2" />
                        Refund
                    </Button>
                )}
                {(status === 'new' || status === 'processing') && (
                    <Button 
                        variant="ghost" 
                        disabled={isPending}
                        onClick={() => onStatusChange('cancelled')}
                        className="h-14 px-6 rounded-2xl bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                    >
                        <XCircle size={20} />
                    </Button>
                )}
            </div>
        </div>
    );
}
