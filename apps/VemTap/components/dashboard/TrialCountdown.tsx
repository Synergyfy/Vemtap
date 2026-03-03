'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';

interface TrialCountdownProps {
    trialEndDate?: string | null;
    className?: string;
    variant?: 'compact' | 'panel';
}

interface TimeLeft {
    expired: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const getTimeLeft = (trialEndDate?: string | null): TimeLeft => {
    if (!trialEndDate) {
        return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const target = new Date(trialEndDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (!Number.isFinite(target) || diff <= 0) {
        return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { expired: false, days, hours, minutes, seconds };
};

export default function TrialCountdown({ trialEndDate, className = '', variant = 'compact' }: TrialCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(trialEndDate));

    useEffect(() => {
        setTimeLeft(getTimeLeft(trialEndDate));
        const id = window.setInterval(() => {
            setTimeLeft(getTimeLeft(trialEndDate));
        }, 1000);

        return () => window.clearInterval(id);
    }, [trialEndDate]);

    const formatted = useMemo(() => {
        if (timeLeft.expired) {
            return 'Trial ended';
        }
        return `${timeLeft.days}d ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`;
    }, [timeLeft]);

    if (variant === 'panel') {
        const blocks = [
            { label: 'Days', value: String(timeLeft.days).padStart(2, '0') },
            { label: 'Hours', value: String(timeLeft.hours).padStart(2, '0') },
            { label: 'Minutes', value: String(timeLeft.minutes).padStart(2, '0') },
            { label: 'Seconds', value: String(timeLeft.seconds).padStart(2, '0') },
        ];

        return (
            <div className={`w-full rounded-[2rem] border border-primary/10 bg-white p-6 md:p-10 shadow-xl shadow-primary/10 ${className}`}>
                <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5">
                    <Clock3 size={12} className="text-amber-700" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Urgent</span>
                </div>
                <h3 className="text-center text-2xl font-black tracking-tight text-text-main mb-8">
                    {timeLeft.expired ? 'Your Trial Has Ended' : 'Your Free Trial Opportunity Ends In:'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {blocks.map((block) => (
                        <div
                            key={block.label}
                            className={`rounded-2xl border px-4 py-5 text-center shadow-md ${block.label === 'Minutes'
                                ? 'border-amber-200 bg-amber-50/60 shadow-amber-100'
                                : 'border-slate-200 bg-slate-50/70'
                                }`}
                        >
                            <p className="text-4xl font-black text-primary leading-none">{block.value}</p>
                            <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500">{block.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 ${className}`}>
            <Clock3 size={14} className="text-primary" />
            <div className="leading-tight">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/80">Free Trial Countdown</p>
                <p className="text-xs font-black text-primary">{formatted}</p>
            </div>
        </div>
    );
}
