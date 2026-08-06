'use client';

import React, { useState, useEffect } from 'react';
import { 
    CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
        if (saved === 'false') setIsMinimized(false);
        else setIsMinimized(true);
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
                className="w-full bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:border-[#066CF4]/30 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <CheckCircle2 size={16} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Activation Progress</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="h-1 w-20 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-[9px] font-black text-primary">{percentage}%</span>
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
            </button>
        );
    }

    return (
        <div className="space-y-6">
            {/* Activation Checklist */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Activation Checklist</h4>
                    <button 
                        onClick={toggleMinimize}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400"
                        title="Minimize"
                    >
                        <ChevronUp size={14} />
                    </button>
                </div>
                
                <div className="space-y-3">
                    {checklistItems.map((item) => (
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
