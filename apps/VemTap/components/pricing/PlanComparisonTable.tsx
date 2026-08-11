'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, Minus, Sparkles, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingPlan } from '@/types/pricing';
import { mapPlanToConfig, PERMISSION_SECTIONS } from '@/lib/planPermissions';
import type { PlanPermissionConfig, PermissionLevel } from '@/lib/planPermissions';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanComparisonTableProps {
    plans: PricingPlan[];
}

export default function PlanComparisonTable({ plans }: PlanComparisonTableProps) {
    const activePlans = plans.filter(p => p.isActive);
    const [isTableExpanded, setIsTableExpanded] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        PERMISSION_SECTIONS.forEach(s => { initial[s.id] = true; });
        return initial;
    });

    if (activePlans.length === 0) return null;

    const permissionConfigs: PlanPermissionConfig[] = activePlans.map(plan =>
        mapPlanToConfig(plan)
    );

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <section className="container mx-auto max-w-7xl mb-32">
            {/* Header */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
                    <Sparkles size={14} className="text-[#066CF4]" />
                    <span className="text-xs font-bold text-[#066CF4] uppercase tracking-wider">Feature Comparison</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                    Compare Plans
                </h2>
                <p className="text-lg text-gray-500 font-medium max-w-lg mx-auto">
                    See exactly what&apos;s included in every plan. No hidden fees.
                </p>

                <button
                    onClick={() => setIsTableExpanded(!isTableExpanded)}
                    className="mx-auto flex items-center gap-2.5 mt-8 h-11 px-6 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:border-[#066CF4]/30 hover:text-[#066CF4] hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer group"
                >
                    <Table2 size={15} className="text-[#066CF4] group-hover:scale-110 transition-transform" />
                    {isTableExpanded ? 'Hide Comparison' : 'Compare All Features'}
                    <ChevronDown
                        size={15}
                        className={cn(
                            "text-gray-400 transition-transform duration-300",
                            isTableExpanded && "rotate-180"
                        )}
                    />
                </button>
            </div>

            {/* Table */}
            <AnimatePresence initial={false}>
                {isTableExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="overflow-x-auto rounded-3xl border border-gray-200/60 bg-white shadow-xl shadow-gray-200/40">
                            <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-6 px-8 w-[280px]">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Features</span>
                            </th>
                            {activePlans.map((plan, idx) => {
                                const isPopular = plan.isPopular;
                                return (
                                    <th
                                        key={plan.id}
                                        className={cn(
                                            "py-6 px-6 text-center relative",
                                            idx === activePlans.length - 1 && "pr-8"
                                        )}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#066CF4] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                                                Popular
                                            </div>
                                        )}
                                        <div className={cn(
                                            "inline-flex flex-col items-center",
                                            isPopular && "pt-2"
                                        )}>
                                            <span className={cn(
                                                "text-sm font-black tracking-tight",
                                                isPopular ? "text-[#066CF4]" : "text-gray-900"
                                            )}>
                                                {plan.name}
                                            </span>
                                            {plan.isFree ? (
                                                <span className="text-xs font-bold text-gray-400 mt-1">Free</span>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-400 mt-1">
                                                    ₦{(plan.monthlyPrice || 0).toLocaleString()}/mo
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {PERMISSION_SECTIONS.map((section) => {
                            const isExpanded = expandedSections[section.id] ?? true;

                            // Count how many features are on across all plans
                            const totalFeatures = section.features.length;

                            return (
                                <React.Fragment key={section.id}>
                                    {/* Section Header */}
                                    <tr
                                        className="cursor-pointer select-none group"
                                        onClick={() => toggleSection(section.id)}
                                    >
                                        <td
                                            colSpan={activePlans.length + 1}
                                            className="px-8 py-4 bg-gray-50/80 border-y border-gray-100"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "size-7 rounded-lg flex items-center justify-center transition-all duration-200",
                                                        "bg-gray-200/60 group-hover:bg-[#066CF4]/10"
                                                    )}>
                                                        <ChevronDown
                                                            size={14}
                                                            strokeWidth={3}
                                                            className={cn(
                                                                "text-gray-400 group-hover:text-[#066CF4] transition-all duration-200",
                                                                isExpanded && "rotate-180"
                                                            )}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-700 transition-colors">
                                                        {section.label}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-300 bg-white rounded-full px-2 py-0.5 border border-gray-100">
                                                        {totalFeatures}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Features */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && section.features.map((feature, fIdx) => (
                                            <motion.tr
                                                key={feature.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="group/row"
                                            >
                                                <td className="py-4 px-8">
                                                    <span className="text-sm font-semibold text-gray-700 group-hover/row:text-gray-900 transition-colors">
                                                        {feature.label}
                                                    </span>
                                                </td>
                                                {activePlans.map((plan, pIdx) => {
                                                    const config = permissionConfigs.find(pc => pc.planId === plan.id);
                                                    const perm = config?.features[feature.id];
                                                    return (
                                                        <td
                                                            key={plan.id}
                                                            className={cn(
                                                                "py-4 px-6 text-center",
                                                                pIdx === activePlans.length - 1 && "pr-8"
                                                            )}
                                                        >
                                                            <PermissionCell
                                                                level={perm?.level ?? 'no'}
                                                                limit={perm?.limit}
                                                                limitUnit={feature.limitUnit}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
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

function PermissionCell({ level, limit, limitUnit }: { level: PermissionLevel; limit?: number; limitUnit?: string }) {
    if (level === 'yes') {
        return (
            <div className="flex items-center justify-center">
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full px-3 py-1.5">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                    <span className="text-xs font-bold text-emerald-700">Included</span>
                </div>
            </div>
        );
    }

    if (level === 'no') {
        return (
            <div className="flex items-center justify-center">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
                    <Minus size={12} className="text-gray-300" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-gray-300">—</span>
                </div>
            </div>
        );
    }

    // Limited — show "Up to X items"
    const unitLabel = limitUnit || 'units';
    return (
        <div className="flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 rounded-full px-3 py-1.5">
                <span className="text-xs font-bold text-amber-700">
                    Up to {limit?.toLocaleString()} {unitLabel}
                </span>
            </div>
        </div>
    );
}
