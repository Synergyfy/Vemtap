'use client';

import React from 'react';
import { CheckCircle2, Sparkles, SlidersHorizontal, CircleDot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutoMode } from '@/services/rotator/types';

/** Green "Automatic" pill used wherever a control is on auto. */
export function AutomaticChip({ compact = false }: { compact?: boolean }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1 rounded-full font-black uppercase tracking-widest",
            compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]",
            "bg-emerald-50 text-emerald-600"
        )}>
            <CheckCircle2 size={compact ? 8 : 9} />
            Automatic
        </span>
    );
}

/** Amber "Manual Override" pill. */
export function ManualChip({ compact = false, label = 'Manual Override' }: { compact?: boolean; label?: string }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1 rounded-full font-black uppercase tracking-widest",
            compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]",
            "bg-amber-50 text-amber-600"
        )}>
            <SlidersHorizontal size={compact ? 8 : 9} />
            {label}
        </span>
    );
}

/** Generic mode chip: Automatic vs Manual for a section. */
export function SectionModeChip({ mode, compact = false }: { mode: AutoMode; compact?: boolean }) {
    return mode === 'automatic'
        ? <AutomaticChip compact={compact} />
        : <ManualChip compact={compact} />;
}

/**
 * The headline automation badge shown next to the cluster name:
 * green when fully automatic, amber when any section has been overridden.
 */
export function AutomationBadge({ overridden, loading }: { overridden: boolean; loading?: boolean }) {
    if (loading) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                <Loader2 size={9} className="animate-spin" /> Checking…
            </span>
        );
    }
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                overridden
                    ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                    : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
            )}
            title={overridden
                ? 'One or more sections have manual overrides active.'
                : 'Everything is managed automatically by Vemtap.'}
        >
            <CircleDot size={10} />
            {overridden ? 'Partially Overridden' : 'Automatic'}
        </span>
    );
}

/** Small stat used in the rotator overview header. */
export function SummaryStat({ label, value, sub, icon }: {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 p-3 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1">
                {icon}
                {label}
            </p>
            <p className="text-base font-bold font-display text-text-main mt-1 truncate">{value}</p>
            {sub && <p className="text-[10px] font-medium text-text-secondary mt-0.5 truncate">{sub}</p>}
        </div>
    );
}

/** Read-only mini-icon for the "if this section is manual" legend. */
export const ROTATION_MODE_ICON = {
    automatic: Sparkles,
    manual: SlidersHorizontal,
} as const;