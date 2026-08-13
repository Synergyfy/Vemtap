'use client';

import React, { useState, useEffect } from 'react';
import { 
    CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

export default function OnboardingChecklist() {
    const router = useRouter();
    const { checklistItems, isComplete, percentage } = useOnboarding();
    const [isMinimized, setIsMinimized] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Use effect to handle mounting and hydration
    useEffect(() => {
        setIsMounted(true);
        const saved = sessionStorage.getItem('vemtap_checklist_minimized');
        // If 'false' was explicitly saved, then we expand it. Otherwise default to true.
        setIsMinimized(saved === 'false' ? false : true);
    }, []);

    const toggleMinimize = () => {
        const newState = !isMinimized;
        setIsMinimized(newState);
        sessionStorage.setItem('vemtap_checklist_minimized', newState.toString());
    };

    if (!isMounted || isComplete) return null;

    if (isMinimized) {
        return (
            <button 
                onClick={toggleMinimize}
                className="w-full bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-[#066CF4]/30 transition-all cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <CheckCircle2 size={15} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-main">Activation Progress</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-primary">{percentage}%</span>
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
            </button>
        );
    }

    return (
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Activation Checklist</h4>
                </div>
                <button 
                    onClick={toggleMinimize}
                    className="size-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 cursor-pointer"
                    title="Minimize"
                >
                    <ChevronUp size={15} />
                </button>
            </div>

            <div className="p-4 md:p-5 space-y-3">
                {checklistItems.map((item) => (
                    <div 
                        key={item.id} 
                        className={cn(
                            "rounded-xl border p-4 md:p-5 transition-all",
                            item.isCompleted ? "border-gray-100 bg-gray-50/60" : "border-gray-100 bg-white hover:border-[#066CF4]/25 hover:shadow-sm"
                        )}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className={cn(
                                "size-10 rounded-lg flex items-center justify-center shrink-0",
                                item.isCompleted ? "bg-emerald-50 text-emerald-500" : "bg-gray-50 text-gray-400"
                            )}>
                                <item.icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5 space-y-1">
                                <div className="flex items-center justify-between gap-2.5">
                                    <h5 className="text-sm font-semibold text-text-main truncate">{item.title}</h5>
                                    {item.isCompleted ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-500 shrink-0">
                                            <CheckCircle2 size={13} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-gray-400 shrink-0">
                                            <span className="size-1.5 rounded-full bg-amber-400" />
                                            <span className="text-[10px] font-semibold uppercase tracking-wider">Pending</span>
                                        </span>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-[13px] leading-relaxed",
                                    item.isCompleted ? "text-text-secondary/80" : "text-text-secondary"
                                )}>
                                    {item.description}
                                </p>
                            </div>
                        </div>

                        {!item.isCompleted && (
                            <div className="mt-4 flex">
                                <button
                                    onClick={() => router.push(item.route)}
                                    className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#066CF4] transition-all active:scale-95 cursor-pointer"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}