'use client';

import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { windowForInstant, DEFAULT_ROTATION_WINDOW_SECONDS } from '@/services/rotator/types';

interface RotationWindowBadgeProps {
    /** Seconds per rotation window (default 60). */
    windowSeconds?: number;
    className?: string;
}

/** Live "Rotation window" badge shown in the rotator header.
 *  Ticks every second so the current window label is always accurate. */
export default function RotationWindowBadge({ windowSeconds, className }: RotationWindowBadgeProps) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const secs = Number.isFinite(windowSeconds) && windowSeconds! > 0 ? windowSeconds! : DEFAULT_ROTATION_WINDOW_SECONDS;
    const window_ = windowForInstant(now, secs);

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 text-[9px] font-black uppercase tracking-widest",
                className,
            )}
            title={`Rotation window is platform-controlled. Everyone scanning in ${window_.label} sees the same featured deals.`}
        >
            <Timer size={10} className="shrink-0" />
            <span className="whitespace-nowrap">Window {secs}s</span>
            <span className="w-px h-3 bg-indigo-200" />
            <span className="whitespace-nowrap tabular-nums">{window_.label}</span>
        </span>
    );
}
