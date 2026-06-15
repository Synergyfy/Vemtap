'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, Circle, ArrowRight, Sparkles, 
    Edit, QrCode, Download, UserPlus, Send,
    PartyPopper
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useMarketingAssets, useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function OnboardingChecklist() {
    const router = useRouter();
    const { data: myBusiness } = useMyBusiness();
    const { data: assets } = useMarketingAssets();
    const { data: marketingAnalytics } = useAnalyticsOverview();
    const { data: dashboardAnalytics } = useDashboardAnalytics();

    const checklistItems = useMemo(() => {
        const stats = dashboardAnalytics?.stats || [];
        const visitorsCount = stats.find(s => s.label.toLowerCase().includes('total visitors'))?.value || '0';
        
        return [
            {
                id: 'profile',
                title: 'Complete Profile',
                description: 'Add your brand logo and business details.',
                icon: Edit,
                isCompleted: !!myBusiness?.logoUrl,
                route: '/dashboard/settings/profile'
            },
            {
                id: 'qr',
                title: 'Generate QR Code',
                description: 'Create your first custom QR code for taps.',
                icon: QrCode,
                isCompleted: !!assets && assets.length > 0,
                route: '/dashboard/marketing-assets/create'
            },
            {
                id: 'assets',
                title: 'Get Marketing Assets',
                description: 'Download print-ready posters and cards.',
                icon: Download,
                isCompleted: (marketingAnalytics?.totals?.downloads || 0) > 0,
                route: '/dashboard/marketing-assets'
            },
            {
                id: 'customer',
                title: 'Capture First Customer',
                description: 'See the magic. Capture your first digital lead.',
                icon: UserPlus,
                isCompleted: visitorsCount !== '0',
                route: '/dashboard/visitors'
            },
            {
                id: 'campaign',
                title: 'Send First Campaign',
                description: 'Reward customers with a welcome offer.',
                icon: Send,
                isCompleted: false, // Placeholder for now
                route: '/dashboard/messaging'
            }
        ];
    }, [myBusiness, assets, marketingAnalytics, dashboardAnalytics]);

    const completedCount = checklistItems.filter(i => i.isCompleted).length;
    const totalCount = checklistItems.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    if (percentage === 100) return null;

    return (
        <div className="space-y-6">
            {/* Welcome Hero Card */}
            <section className="bg-white rounded-[2.5rem] overflow-hidden relative border border-gray-100 shadow-sm">
                <div className="p-8 flex flex-col gap-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <span className="bg-[#066CF4]/10 text-[#066CF4] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {percentage}% Setup Complete
                        </span>
                        <div className="size-12 bg-[#066CF4]/5 rounded-2xl flex items-center justify-center text-[#066CF4]">
                            <PartyPopper size={28} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome to Vemtap</h2>
                        <p className="text-sm font-medium text-gray-400 max-w-[280px] leading-relaxed">
                            Your journey to seamless customer engagement starts here. Let's get your first tap ready.
                        </p>
                    </div>
                    <Button 
                        onClick={() => router.push(checklistItems.find(i => !i.isCompleted)?.route || '/dashboard')}
                        className="h-14 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 w-full sm:w-fit px-8"
                    >
                        Continue Setup
                        <ArrowRight size={18} />
                    </Button>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-12 -top-12 size-48 bg-[#066CF4]/5 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* Activation Progress */}
            <section className="bg-white rounded-[2.5rem] p-8 flex items-center gap-8 border border-gray-100 shadow-sm">
                <div className="relative size-20 flex-shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                        <circle className="stroke-gray-50" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                        <circle 
                            className="stroke-[#066CF4] transition-all duration-1000" 
                            cx="18" cy="18" 
                            fill="none" 
                            r="16" 
                            strokeDasharray={`${percentage} 100`} 
                            strokeLinecap="round" 
                            strokeWidth="3"
                        ></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-[#066CF4]">{percentage}%</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-1">Activation Progress</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed">
                        Complete the checklist below to activate your account features.
                    </p>
                </div>
            </section>

            {/* Activation Checklist */}
            <section className="flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Activation Checklist</h4>
                
                <div className="space-y-3">
                    {checklistItems.map((item, i) => (
                        <div 
                            key={item.id} 
                            className={cn(
                                "bg-white p-5 rounded-[2rem] flex flex-col gap-5 border-l-4 shadow-sm transition-all",
                                item.isCompleted ? "border-emerald-500 opacity-60" : "border-gray-100 hover:border-[#066CF4]/30"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "size-10 rounded-xl flex items-center justify-center shrink-0",
                                    item.isCompleted ? "bg-emerald-50 text-emerald-500" : "bg-gray-50 text-gray-400"
                                )}>
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h5 className="text-sm font-black text-gray-900">{item.title}</h5>
                                        {item.isCompleted ? (
                                            <div className="flex items-center gap-1.5 text-emerald-500">
                                                <CheckCircle2 size={14} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Completed</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Pending</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.description}</p>
                                </div>
                            </div>
                            
                            {!item.isCompleted && (
                                <Button 
                                    onClick={() => router.push(item.route)}
                                    className="w-full h-12 bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#066CF4] transition-all"
                                >
                                    Get Started
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
