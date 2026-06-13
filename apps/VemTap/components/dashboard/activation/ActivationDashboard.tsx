'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Building, QrCode, Download, Users, Megaphone, 
    CheckCircle2, Circle, Lock, ArrowRight,
    PlayCircle, Compass, BookOpen, MessageSquare
} from 'lucide-react';
import { useActivationStore, ActivationStep } from '@/store/useActivationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CHECKLIST_ITEMS: {
    id: ActivationStep;
    title: string;
    description: string;
    icon: any;
}[] = [
    {
        id: 'profile',
        title: 'Complete Profile',
        description: 'Add your business information and branding.',
        icon: Building,
    },
    {
        id: 'qr',
        title: 'Generate QR Code',
        description: 'Create your customer capture QR code.',
        icon: QrCode,
    },
    {
        id: 'assets',
        title: 'Download Marketing Assets',
        description: 'Get posters and materials to display your QR code.',
        icon: Download,
    },
    {
        id: 'customer',
        title: 'Capture First Customer',
        description: 'Get your first customer registration.',
        icon: Users,
    },
    {
        id: 'campaign',
        title: 'Send First Campaign',
        description: 'Send your first promotional message.',
        icon: Megaphone,
    },
];

export default function ActivationDashboard() {
    const { 
        progress, 
        completedSteps, 
        setWizardOpen, 
        setWizardStep 
    } = useActivationStore();

    const handleStartSetup = () => {
        setWizardStep(1);
        setWizardOpen(true);
    };

    const handleStepClick = (stepIndex: number) => {
        setWizardStep(stepIndex + 1);
        setWizardOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 pb-24">
            {/* Welcome Hero Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#066CF4] to-[#4293FF] p-8 text-white shadow-xl shadow-blue-500/20"
            >
                {/* Abstract circles */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

                <div className="relative z-10">
                    <div className="mb-4 flex items-center justify-between">
                        <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-md border-none px-3 py-1 font-bold">
                            {progress}% Activated
                        </Badge>
                    </div>
                    <h1 className="mb-2 text-3xl font-black leading-tight md:text-4xl">
                        Welcome to Vemtap 👋
                    </h1>
                    <p className="mb-8 max-w-md text-lg font-medium text-white/80">
                        Your business is ready. Let's complete a few important steps to start capturing customers and growing your business.
                    </p>
                    <Button 
                        onClick={handleStartSetup}
                        className="h-14 rounded-2xl bg-white px-8 text-lg font-black text-[#066CF4] shadow-lg shadow-black/10 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        Start Setup
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </motion.div>

            {/* Progress & Score Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Activation Progress Card */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                        <svg className="h-full w-full" viewBox="0 0 100 100">
                            <circle 
                                className="text-gray-100" 
                                strokeWidth="8" 
                                stroke="currentColor" 
                                fill="transparent" 
                                r="40" 
                                cx="50" 
                                cy="50" 
                            />
                            <circle 
                                className="text-[#066CF4] transition-all duration-1000 ease-out" 
                                strokeWidth="8" 
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                                strokeLinecap="round" 
                                stroke="currentColor" 
                                fill="transparent" 
                                r="40" 
                                cx="50" 
                                cy="50" 
                            />
                        </svg>
                        <span className="absolute text-xl font-black text-gray-900">{progress}%</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Activation Progress</h3>
                        <p className="text-sm font-medium text-gray-500">
                            Complete the steps below to unlock your full Vemtap experience.
                        </p>
                    </div>
                </div>

                {/* Activation Score Card */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Business Activation Score</h3>
                        <Badge className={cn(
                            "px-3 py-1 font-bold",
                            progress === 100 ? "bg-emerald-500" : "bg-blue-500"
                        )}>
                            {progress < 25 ? 'Just Getting Started' : progress < 100 ? 'Building Momentum' : 'Fully Activated'}
                        </Badge>
                    </div>
                    <div className="text-4xl font-black text-gray-900 mb-4">{progress}%</div>
                    <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full bg-[#066CF4] transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            {/* Activation Checklist */}
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="mb-6 text-2xl font-black text-gray-900">Activation Checklist</h3>
                <div className="flex flex-col gap-4">
                    {CHECKLIST_ITEMS.map((item, index) => {
                        const isCompleted = completedSteps.includes(item.id);
                        const Icon = item.icon;
                        
                        return (
                            <div 
                                key={item.id}
                                className={cn(
                                    "group flex items-center gap-4 rounded-3xl border p-4 transition-all active:scale-[0.98]",
                                    isCompleted ? "border-emerald-100 bg-emerald-50/30" : "border-gray-100 bg-white hover:border-blue-100 hover:bg-blue-50/30"
                                )}
                            >
                                <div className={cn(
                                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all",
                                    isCompleted ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-blue-500 group-hover:text-white"
                                )}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className={cn(
                                        "truncate text-base font-bold transition-all",
                                        isCompleted ? "text-emerald-900" : "text-gray-900"
                                    )}>
                                        {item.title}
                                    </h4>
                                    <p className="truncate text-xs font-medium text-gray-500">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isCompleted ? (
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    ) : (
                                        <Button 
                                            size="sm"
                                            onClick={() => handleStepClick(index)}
                                            className="h-9 rounded-xl bg-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600"
                                        >
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Learn Vemtap Section */}
            <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center gap-3 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 transition-all active:scale-95">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl shadow-sm">
                        <PlayCircle size={28} />
                    </div>
                    <span className="text-xs font-black text-gray-900">Watch Demo</span>
                </button>
                <button className="flex flex-col items-center gap-3 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 transition-all active:scale-95">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                        <Compass size={28} />
                    </div>
                    <span className="text-xs font-black text-gray-900">Product Tour</span>
                </button>
                <button className="flex flex-col items-center gap-3 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 transition-all active:scale-95">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                        <BookOpen size={28} />
                    </div>
                    <span className="text-xs font-black text-gray-900">Setup Guide</span>
                </button>
                <button className="flex flex-col items-center gap-3 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 transition-all active:scale-95">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                        <MessageSquare size={28} />
                    </div>
                    <span className="text-xs font-black text-gray-900">Contact Support</span>
                </button>
            </div>
        </div>
    );
}
