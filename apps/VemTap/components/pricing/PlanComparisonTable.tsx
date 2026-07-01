'use client';

import React, { useState } from 'react';
import { Check, X, ChevronDown, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingPlan } from '@/types/pricing';
import { buildDefaultPermissions, PERMISSION_SECTIONS } from '@/lib/mock/planPermissions';
import type { PlanPermissionConfig, PermissionLevel } from '@/lib/mock/planPermissions';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanComparisonTableProps {
    plans: PricingPlan[];
}

export default function PlanComparisonTable({ plans }: PlanComparisonTableProps) {
    const activePlans = plans.filter(p => p.isActive);
    const [isTableExpanded, setIsTableExpanded] = useState(false);

    if (activePlans.length === 0) return null;

    const permissionConfigs: PlanPermissionConfig[] = activePlans.map(plan =>
        buildDefaultPermissions(plan.name, plan.id)
    );

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        PERMISSION_SECTIONS.forEach(s => { initial[s.id] = true; });
        return initial;
    });

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <section className="container mx-auto max-w-7xl mb-32">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
                    Compare <span className="text-[#066CF4]">Features</span>
                </h2>
                <p className="text-lg text-gray-500 font-medium mb-6">
                    See exactly what you get with each plan.
                </p>
                
                <button
                    onClick={() => setIsTableExpanded(!isTableExpanded)}
                    className="mx-auto flex items-center justify-center gap-2 h-12 px-6 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all cursor-pointer border border-gray-200 shadow-sm"
                >
                    <TableIcon size={16} className="text-[#066CF4]" />
                    {isTableExpanded ? 'Hide Detailed Comparison' : 'Show Detailed Comparison'}
                    <ChevronDown size={16} className={cn("transition-transform duration-300", isTableExpanded && "rotate-180")} />
                </button>
            </div>

            <AnimatePresence>
                {isTableExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="overflow-x-auto rounded-[32px] border border-gray-100 bg-white shadow-sm mt-8">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left p-5 pl-8 text-[10px] font-black uppercase tracking-widest text-gray-400 w-[220px]">
                                            Features
                                        </th>
                                        {activePlans.map((plan, idx) => (
                                            <th
                                                key={plan.id}
                                                className={cn(
                                                    "p-5 text-center text-sm font-black",
                                                    idx === activePlans.length - 1 && "pr-8"
                                                )}
                                            >
                                                {plan.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PERMISSION_SECTIONS.map((section, sIdx) => {
                                        const isExpanded = expandedSections[section.id] ?? true;
                                        return (
                                            <React.Fragment key={section.id}>
                                                <tr
                                                    className={cn(
                                                        "cursor-pointer select-none transition-colors hover:bg-blue-50/60",
                                                        sIdx > 0 && "border-t-2 border-gray-100"
                                                    )}
                                                    onClick={() => toggleSection(section.id)}
                                                >
                                                    <td
                                                        colSpan={activePlans.length + 1}
                                                        className="px-8 py-3 bg-blue-50/80"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#066CF4]">
                                                                {section.label}
                                                            </span>
                                                            <ChevronDown
                                                                size={14}
                                                                strokeWidth={3}
                                                                className={cn(
                                                                    "text-[#066CF4] transition-transform duration-300",
                                                                    isExpanded ? "rotate-0" : "-rotate-90"
                                                                )}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && section.features.map((feature, fIdx) => (
                                                    <tr
                                                        key={feature.id}
                                                        className={cn(
                                                            "transition-colors",
                                                            fIdx % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                                                            "hover:bg-blue-50/40"
                                                        )}
                                                    >
                                                        <td className="p-4 pl-8 text-sm font-bold text-gray-700">
                                                            {feature.label}
                                                        </td>
                                                        {activePlans.map((plan, pIdx) => {
                                                            const config = permissionConfigs.find(pc => pc.planId === plan.id);
                                                            const perm = config?.features[feature.id];
                                                            return (
                                                                <td
                                                                    key={plan.id}
                                                                    className={cn(
                                                                        "p-4 text-center",
                                                                        pIdx === activePlans.length - 1 && "pr-8"
                                                                    )}
                                                                >
                                                                    <PermissionCell level={perm?.level ?? 'no'} limit={perm?.limit} />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

function PermissionCell({ level, limit }: { level: PermissionLevel; limit?: number }) {
    if (level === 'yes') {
        return (
            <div className="flex items-center justify-center">
                <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center ring-2 ring-emerald-200/50">
                    <Check size={14} className="text-emerald-600" strokeWidth={3} />
                </div>
            </div>
        );
    }
    if (level === 'no') {
        return (
            <div className="flex items-center justify-center">
                <div className="size-7 rounded-full bg-red-50 flex items-center justify-center ring-2 ring-red-200/50">
                    <X size={14} className="text-red-400" strokeWidth={3} />
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm">
                {limit ?? 'Limited'}
            </span>
        </div>
    );
}
