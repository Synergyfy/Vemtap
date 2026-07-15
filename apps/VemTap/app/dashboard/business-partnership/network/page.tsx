'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Calendar, MessageSquare, Share2, ChevronRight, X, Clock, TrendingUp, MapPin, Mail, Phone, Smartphone, ExternalLink, CheckCheck, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockBusinesses = [
    { id: '1', name: 'Casa del Sabor', category: 'Food & Drinks', logo: null, subscription: 'Premium', status: 'Active', renewalDate: '2026-09-15', introduced: 3, monthlyCommission: 4500, partnerSince: 'Jan 2026' },
    { id: '2', name: 'TechVault NG', category: 'Electronics', logo: null, subscription: 'Business', status: 'Active', renewalDate: '2026-08-01', introduced: 5, monthlyCommission: 8200, partnerSince: 'Mar 2026' },
    { id: '3', name: 'Velvet & Thread', category: 'Fashion', logo: null, subscription: 'Starter', status: 'Active', renewalDate: '2026-10-20', introduced: 1, monthlyCommission: 1200, partnerSince: 'Apr 2026' },
    { id: '4', name: 'Glow Studio', category: 'Health & Beauty', logo: null, subscription: 'Premium', status: 'Active', renewalDate: '2026-07-30', introduced: 2, monthlyCommission: 3800, partnerSince: 'Feb 2026' },
    { id: '5', name: 'Skyline Rooftop Bar', category: 'Food & Drinks', logo: null, subscription: 'Business', status: 'Inactive', renewalDate: '2026-06-01', introduced: 0, monthlyCommission: 0, partnerSince: 'Jan 2026' },
    { id: '6', name: 'AutoPro Workshop', category: 'Services', logo: null, subscription: 'Starter', status: 'Active', renewalDate: '2026-12-15', introduced: 4, monthlyCommission: 2100, partnerSince: 'May 2026' },
    { id: '7', name: 'Serenity Spa', category: 'Health & Beauty', logo: null, subscription: 'Premium', status: 'Active', renewalDate: '2026-11-01', introduced: 2, monthlyCommission: 5600, partnerSince: 'Mar 2026' },
    { id: '8', name: 'QuickShop Express', category: 'Services', logo: null, subscription: 'Business', status: 'Active', renewalDate: '2026-09-30', introduced: 6, monthlyCommission: 9400, partnerSince: 'Feb 2026' },
];

const categoryColors: Record<string, string> = {
    'Food & Drinks': 'bg-orange-500',
    'Electronics': 'bg-blue-500',
    'Fashion': 'bg-pink-500',
    'Health & Beauty': 'bg-purple-500',
    'Services': 'bg-emerald-500',
};

const subscriptionBadges: Record<string, string> = {
    'Starter': 'bg-gray-100 text-gray-600',
    'Business': 'bg-blue-50 text-blue-600',
    'Premium': 'bg-amber-50 text-amber-600',
};

const messageChannels = [
    { id: 'chat', label: 'In-App Chat', icon: MessageSquare, desc: 'Send a message via VEMTAP chat' },
    { id: 'sms', label: 'SMS', icon: Smartphone, desc: 'Send an SMS text message' },
    { id: 'whatsapp', label: 'WhatsApp', icon: Phone, desc: 'Open WhatsApp chat' },
    { id: 'email', label: 'Email', icon: Mail, desc: 'Send an email' },
];

const drawerSections = [
    { label: 'Renewal History', icon: Calendar, content: 'No renewal history available for this business yet.' },
    { label: 'Activity Timeline', icon: Clock, content: 'No recent activity recorded for this business.' },
    { label: 'Commission Generated', icon: TrendingUp, content: 'Commission breakdown will be available after the first billing cycle.' },
    { label: 'Discovery Performance', icon: MapPin, content: 'Discovery performance metrics are being calculated.' },
];

export default function PartnershipNetworkPage() {
    const [selectedBusiness, setSelectedBusiness] = useState<typeof mockBusinesses[0] | null>(null);
    const [messageBusiness, setMessageBusiness] = useState<typeof mockBusinesses[0] | null>(null);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    const handleSectionClick = (label: string) => {
        setActiveSection(activeSection === label ? null : label);
    };

    return (
        <div className="space-y-5 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
                <p className="text-xs md:text-sm text-gray-500 font-medium">{mockBusinesses.length} businesses in your network</p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select className="flex-1 sm:flex-none h-9 md:h-10 px-2.5 md:px-3 bg-white border border-gray-200 rounded-xl text-[11px] md:text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                    <select className="flex-1 sm:flex-none h-9 md:h-10 px-2.5 md:px-3 bg-white border border-gray-200 rounded-xl text-[11px] md:text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>All Categories</option>
                        <option>Food & Drinks</option>
                        <option>Electronics</option>
                        <option>Fashion</option>
                        <option>Health & Beauty</option>
                        <option>Services</option>
                    </select>
                </div>
            </div>

            {/* Business Cards */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
            >
                {mockBusinesses.map((business, i) => (
                    <motion.div
                        key={business.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                        onClick={() => setSelectedBusiness(business)}
                    >
                        <div className="flex items-start justify-between mb-3 md:mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="size-11 md:size-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                    <Building2 size={22} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{business.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={cn("size-1.5 md:size-2 rounded-full shrink-0", business.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300')} />
                                        <span className="text-[11px] font-medium text-gray-500">{business.status}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] md:text-xs">
                                <span className="text-gray-400 font-medium">Category</span>
                                <span className="flex items-center gap-1.5">
                                    <span className={cn("size-1.5 md:size-2 rounded-full shrink-0", categoryColors[business.category] || 'bg-gray-400')} />
                                    {business.category}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] md:text-xs">
                                <span className="text-gray-400 font-medium">Subscription</span>
                                <span className={cn("px-1.5 md:px-2 py-0.5 rounded-md text-[10px] font-semibold", subscriptionBadges[business.subscription])}>
                                    {business.subscription}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] md:text-xs">
                                <span className="text-gray-400 font-medium">Renewal</span>
                                <span className="text-gray-600 font-medium">{business.renewalDate}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] md:text-xs">
                                <span className="text-gray-400 font-medium">Introduced</span>
                                <span className="text-gray-600 font-medium">{business.introduced} businesses</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] md:text-xs">
                                <span className="text-gray-400 font-medium">Commission</span>
                                <span className="text-emerald-600 font-semibold">₦{business.monthlyCommission.toLocaleString()}/mo</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 md:mt-4 pt-2.5 md:pt-3 border-t border-gray-50">
                            <button
                                onClick={(e) => { e.stopPropagation(); setMessageBusiness(business); }}
                                className="flex-1 h-10 md:h-11 bg-gray-50 hover:bg-gray-100 rounded-lg text-[11px] md:text-xs font-medium text-gray-600 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <MessageSquare size={13} /> Message
                            </button>
                            <button className="flex-1 h-10 md:h-11 bg-gray-50 hover:bg-gray-100 rounded-lg text-[11px] md:text-xs font-medium text-gray-600 transition-colors flex items-center justify-center gap-1.5">
                                <Share2 size={13} /> Share
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Side Drawer */}
            <AnimatePresence>
                {selectedBusiness && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedBusiness(null); setActiveSection(null); }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <h2 className="text-sm md:text-lg font-semibold text-gray-900">Business Details</h2>
                                    <button onClick={() => { setSelectedBusiness(null); setActiveSection(null); }} className="size-10 md:size-11 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0">
                                        <X size={18} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
                                    <div className="flex items-center gap-3 md:gap-4 mb-4">
                                        <div className="size-14 md:size-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                                            <Building2 size={28} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">{selectedBusiness.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5 md:mt-1 flex-wrap">
                                                <span className={cn("size-1.5 md:size-2 rounded-full shrink-0", selectedBusiness.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300')} />
                                                <span className="text-[11px] md:text-sm text-gray-500">{selectedBusiness.status}</span>
                                                <span className="text-gray-300 hidden xs:inline">·</span>
                                                <span className="text-[11px] md:text-sm text-gray-500">Partner since {selectedBusiness.partnerSince}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="bg-white rounded-xl p-3">
                                            <p className="text-[10px] md:text-[11px] font-medium text-gray-400 mb-1">Monthly Commission</p>
                                            <p className="text-base md:text-lg font-bold text-emerald-600">₦{selectedBusiness.monthlyCommission.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-3">
                                            <p className="text-[10px] md:text-[11px] font-medium text-gray-400 mb-1">Businesses Introduced</p>
                                            <p className="text-base md:text-lg font-bold text-gray-900">{selectedBusiness.introduced}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Sections */}
                                <div className="space-y-2 md:space-y-3">
                                    {drawerSections.map((section) => {
                                        const Icon = section.icon;
                                        const isOpen = activeSection === section.label;
                                        return (
                                            <div key={section.label} className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all">
                                                <button
                                                    onClick={() => handleSectionClick(section.label)}
                                                    className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                                            <Icon size={16} />
                                                        </div>
                                                        <span className="text-xs md:text-sm font-medium text-gray-700">{section.label}</span>
                                                    </div>
                                                    <ChevronRight size={16} className={cn("text-gray-300 group-hover:text-primary transition-all shrink-0", isOpen && "rotate-90")} />
                                                </button>
                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0">
                                                                <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                                                                    <p className="text-[11px] md:text-xs text-gray-500">{section.content}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Message Channel Picker Modal */}
            <AnimatePresence>
                {messageBusiness && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMessageBusiness(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm bg-white rounded-3xl shadow-2xl z-[60] overflow-hidden"
                        >
                            <div className="p-5 md:p-6">
                                <div className="flex items-start justify-between mb-4 md:mb-5">
                                    <div className="min-w-0">
                                        <h3 className="text-base md:text-lg font-bold text-gray-900">Message</h3>
                                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Choose how to contact {messageBusiness.name}</p>
                                    </div>
                                    <button onClick={() => setMessageBusiness(null)} className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 ml-3">
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {messageChannels.map((ch) => {
                                        const Icon = ch.icon;
                                        return (
                                            <button
                                                key={ch.id}
                                                onClick={() => { setMessageBusiness(null); }}
                                                className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group"
                                            >
                                                <div className="size-10 md:size-11 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shadow-sm shrink-0">
                                                    <Icon size={18} />
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="text-xs md:text-sm font-semibold text-gray-900">{ch.label}</p>
                                                    <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5 truncate">{ch.desc}</p>
                                                </div>
                                                <ExternalLink size={14} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
