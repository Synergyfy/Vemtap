'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ChevronDown, ChevronRight, Check, X, RotateCcw,
    Save, SlidersHorizontal, Info, Loader2, Lock, Unlock,
    Minus, AlertCircle, ExternalLink
} from 'lucide-react';
import { PricingPlan } from '@/types/pricing';
import {
    PERMISSION_SECTIONS,
    PermissionSection,
    PlanFeature,
    PermissionLevel,
    PlanPermissionConfig,
    FeaturePermission,
    buildDefaultPermissions,
    mapPlanToConfig,
    mapConfigToPlanDto,
} from '@/lib/planPermissions';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useUpdatePlanPermissions } from '@/services/pricing/hooks';

interface PlanPermissionsTabProps {
    plans: PricingPlan[];
    isLoading: boolean;
}

export default function PlanPermissionsTab({ plans, isLoading }: PlanPermissionsTabProps) {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [configs, setConfigs] = useState<Record<string, PlanPermissionConfig>>({});
    const [limitModal, setLimitModal] = useState<{
        planId: string;
        featureId: string;
        currentLimit: number;
    } | null>(null);
    const [limitInput, setLimitInput] = useState('');

    // Tracks the last-saved config snapshot so we only send changed fields on save
    const originalConfigsRef = useRef<Record<string, PlanPermissionConfig>>({});

    // Computes a partial DTO containing only fields that differ from the original
    const computePermissionDiff = useCallback((
        current: PlanPermissionConfig,
        original: PlanPermissionConfig,
        plan: PricingPlan
    ): Partial<PricingPlan> => {
        const fullDto = mapConfigToPlanDto(current, plan);
        const originalDto = mapConfigToPlanDto(original, plan);
        const diff: Partial<PricingPlan> = {};
        for (const key of Object.keys(fullDto) as (keyof Partial<PricingPlan>)[]) {
            if (fullDto[key] !== originalDto[key]) {
                (diff as any)[key] = fullDto[key];
            }
        }
        return diff;
    }, []);

    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    const config = selectedPlanId ? configs[selectedPlanId] : null;

    const updatePermissionsMutation = useUpdatePlanPermissions();
    const isSaving = updatePermissionsMutation.isPending;

    // Initialize configs from plans (once)
    const initialized = useMemo(() => {
        if (plans.length === 0) return false;
        const newConfigs: Record<string, PlanPermissionConfig> = {};
        plans.forEach(plan => {
            const key = plan.id;
            if (!configs[key]) {
                const cfg = mapPlanToConfig(plan);
                newConfigs[key] = cfg;
                originalConfigsRef.current[key] = JSON.parse(JSON.stringify(cfg));
            }
        });
        if (Object.keys(newConfigs).length > 0) {
            setConfigs(prev => ({ ...prev, ...newConfigs }));
        }
        if (!selectedPlanId && plans.length > 0) {
            setSelectedPlanId(plans[0].id);
        }
        return true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plans]);

    // Filter sections/features by search
    const filteredSections = useMemo(() => {
        if (!search.trim()) return PERMISSION_SECTIONS;
        const q = search.toLowerCase();
        return PERMISSION_SECTIONS.map(section => ({
            ...section,
            features: section.features.filter(f =>
                f.label.toLowerCase().includes(q) ||
                section.label.toLowerCase().includes(q)
            ),
        })).filter(s => s.features.length > 0);
    }, [search]);

    const toggleSection = useCallback((sectionId: string) => {
        setExpandedSection(prev => prev === sectionId ? null : sectionId);
    }, []);

    const updateDirectLimit = useCallback((featureId: string, limitVal: number) => {
        if (!selectedPlanId) return;
        const val = isNaN(limitVal) || limitVal < 1 ? 1 : limitVal;
        setConfigs(prev => {
            const plan = prev[selectedPlanId];
            if (!plan) return prev;
            return {
                ...prev,
                [selectedPlanId]: {
                    ...plan,
                    features: {
                        ...plan.features,
                        [featureId]: {
                            ...plan.features[featureId],
                            level: 'limited',
                            limit: val,
                        },
                    },
                },
            };
        });
    }, [selectedPlanId]);

    const openLimitModal = useCallback((featureId: string) => {
        if (!selectedPlanId || !config) return;
        const perm = config.features[featureId];
        const defaultFeat = PERMISSION_SECTIONS.flatMap(s => s.features).find(f => f.id === featureId);
        const currentVal = perm?.limit ?? defaultFeat?.defaultLimit ?? 50;
        setLimitModal({ planId: selectedPlanId, featureId, currentLimit: currentVal });
        setLimitInput(String(currentVal));
    }, [selectedPlanId, config]);

    const setFeatureLevel = useCallback((featureId: string, level: PermissionLevel) => {
        if (!selectedPlanId) return;
        setConfigs(prev => {
            const plan = prev[selectedPlanId];
            if (!plan) return prev;
            const current = plan.features[featureId] || { level: 'no', limit: undefined };
            const defaultFeat = PERMISSION_SECTIONS.flatMap(s => s.features).find(f => f.id === featureId);
            const newLimit = level === 'yes' ? undefined : (level === 'limited' ? (current.limit || defaultFeat?.defaultLimit || 50) : undefined);
            return {
                ...prev,
                [selectedPlanId]: {
                    ...plan,
                    features: {
                        ...plan.features,
                        [featureId]: { level, limit: newLimit },
                    },
                },
            };
        });
    }, [selectedPlanId]);

    const saveLimit = useCallback(() => {
        if (!limitModal) return;
        const val = parseInt(limitInput, 10);
        if (isNaN(val) || val < 1) {
            toast.error('Enter a valid number greater than 0');
            return;
        }
        setConfigs(prev => ({
            ...prev,
            [limitModal.planId]: {
                ...prev[limitModal.planId],
                features: {
                    ...prev[limitModal.planId]?.features,
                    [limitModal.featureId]: {
                        ...prev[limitModal.planId]?.features[limitModal.featureId],
                        level: 'limited',
                        limit: val,
                    },
                },
            },
        }));
        setLimitModal(null);
        toast.success('Limit updated');
    }, [limitModal, limitInput]);

    const resetPlanDefaults = useCallback(() => {
        if (!selectedPlan) return;
        const defaults = buildDefaultPermissions(selectedPlan.name, selectedPlan.id);
        setConfigs(prev => ({ ...prev, [selectedPlan.id]: defaults }));
        originalConfigsRef.current[selectedPlan.id] = JSON.parse(JSON.stringify(defaults));
        toast.success(`${selectedPlan.name} permissions reset to defaults`);
    }, [selectedPlan]);

    const handleSave = useCallback(async () => {
        if (!selectedPlanId || !config || !selectedPlan) return;
        const original = originalConfigsRef.current[selectedPlanId];
        if (!original) return;
        try {
            const dto = computePermissionDiff(config, original, selectedPlan);
            if (Object.keys(dto).length === 0) {
                toast('No changes to save');
                return;
            }
            await updatePermissionsMutation.mutateAsync({
                planId: selectedPlanId,
                permissions: dto
            });
            // Update the original snapshot to reflect the newly saved state
            originalConfigsRef.current[selectedPlanId] = JSON.parse(JSON.stringify(config));
        } catch (err) {
            console.error('Failed to save plan permissions:', err);
        }
    }, [selectedPlanId, config, selectedPlan, updatePermissionsMutation, computePermissionDiff]);

    const getLevelIcon = (level: PermissionLevel) => {
        switch (level) {
            case 'yes': return Check;
            case 'no': return X;
            case 'limited': return SlidersHorizontal;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={24} className="animate-spin text-primary" />
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="text-center py-24">
                <Lock size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">No plans available</p>
                <p className="text-xs text-gray-300 mt-1">Create a pricing plan first to configure permissions.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500 font-medium">
                        Control which features each plan can access. Set feature availability and usage limits per plan.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedPlan && (
                        <button
                            onClick={resetPlanDefaults}
                            className="h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                        >
                            <RotateCcw size={14} /> Reset to Default
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-10 px-5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isSaving ? 'Saving...' : 'Save Permissions'}
                    </button>
                </div>
            </div>

            {/* Plan pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {plans.map(plan => {
                    const isActive = plan.id === selectedPlanId;
                    const pConfig = configs[plan.id];
                    const totalFeatures = PERMISSION_SECTIONS.reduce((sum, s) => sum + s.features.length, 0);
                    const enabledCount = pConfig
                        ? Object.values(pConfig.features).filter(f => f.level === 'yes' || f.level === 'limited').length
                        : 0;

                    return (
                        <button
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={cn(
                                "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 text-left transition-all shrink-0",
                                isActive
                                    ? "bg-primary/5 border-primary shadow-lg shadow-primary/5"
                                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                            )}
                        >
                            <div className={cn(
                                "size-10 rounded-xl flex items-center justify-center",
                                isActive ? "bg-primary text-white" : "bg-gray-50 text-gray-400"
                            )}>
                                <Lock size={16} />
                            </div>
                            <div>
                                <p className={cn("text-sm font-bold", isActive ? "text-primary" : "text-gray-900")}>
                                    {plan.name}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                                    {enabledCount}/{totalFeatures} features
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search features..."
                    className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all"
                />
            </div>

            {/* Feature sections */}
            <div className="space-y-4">
                {filteredSections.map(section => {
                    const sectionConfig = config;
                    const isOpen = expandedSection === section.id;

                    return (
                        <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            {/* Section header */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isOpen
                                        ? <ChevronDown size={16} className="text-gray-400" />
                                        : <ChevronRight size={16} className="text-gray-400" />
                                    }
                                    <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">
                                        {section.label}
                                    </h3>
                                </div>
                                {sectionConfig && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        {['yes', 'limited', 'no'].map(level => {
                                            const count = section.features.filter(f => {
                                                const perm = sectionConfig.features[f.id];
                                                return perm?.level === level;
                                            }).length;
                                            if (count === 0) return null;
                                            return (
                                                <span key={level} className={cn(
                                                    "px-2 py-0.5 rounded",
                                                    level === 'yes' && "bg-green-50 text-green-600",
                                                    level === 'limited' && "bg-amber-50 text-amber-600",
                                                    level === 'no' && "bg-red-50 text-red-500",
                                                )}>
                                                    {level === 'yes' ? '✓' : level === 'limited' ? '~' : '✗'} {count}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-gray-50">
                                            {section.features.map((feature, fi) => {
                                                const perm = sectionConfig?.features[feature.id] || { level: 'no' as PermissionLevel };
                                                const isChild = !!feature.parentId;
                                                const LevelIcon = getLevelIcon(perm.level);

                                                return (
                                                    <div
                                                        key={feature.id}
                                                        className={cn(
                                                            "flex items-center justify-between px-5 py-3 transition-colors",
                                                            fi % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                                                            isChild && "pl-14"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            {isChild && (
                                                                <div className="size-1 rounded-full bg-gray-300 shrink-0" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-gray-800 truncate">
                                                                    {feature.label}
                                                                </p>
                                                            </div>
                                                            {/* Inline editable limit input */}
                                                            {perm.level === 'limited' && (
                                                                <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/80 rounded-lg px-2 py-1 shrink-0 shadow-sm">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={perm.limit ?? 50}
                                                                        onChange={(e) => updateDirectLimit(feature.id, parseInt(e.target.value, 10))}
                                                                        className="w-16 h-6 text-xs font-black text-amber-800 bg-white border border-amber-300 rounded text-center outline-none focus:ring-2 focus:ring-amber-500/30"
                                                                    />
                                                                    <span className="text-[10px] font-bold text-amber-700">
                                                                        {feature.limitUnit || ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {perm.level === 'yes' && (
                                                                <span className="text-[10px] font-bold text-green-600 shrink-0">
                                                                    Unlimited
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Segmented control */}
                                                        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
                                                            {(['yes', 'limited', 'no'] as PermissionLevel[]).map(level => {
                                                                const isCurrent = perm.level === level;
                                                                const Icon = getLevelIcon(level);
                                                                return (
                                                                    <button
                                                                        key={level}
                                                                        onClick={() => setFeatureLevel(feature.id, level)}
                                                                        onDoubleClick={level === 'limited' && perm.level === 'limited' ? () => openLimitModal(feature.id) : undefined}
                                                                        className={cn(
                                                                            "px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1",
                                                                            isCurrent
                                                                                ? level === 'yes'
                                                                                    ? 'bg-white text-green-600 shadow-sm'
                                                                                    : level === 'limited'
                                                                                        ? 'bg-white text-amber-600 shadow-sm'
                                                                                        : 'bg-white text-red-500 shadow-sm'
                                                                                : 'text-gray-400 hover:text-gray-600'
                                                                        )}
                                                                    >
                                                                        <Icon size={11} />
                                                                        <span className="hidden sm:inline">
                                                                            {level === 'yes' ? 'Yes' : level === 'no' ? 'No' : 'Limited'}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                            {perm.level === 'limited' && (
                                                                <button
                                                                    onClick={() => openLimitModal(feature.id)}
                                                                    className="px-1.5 py-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                                    title="Set limit"
                                                                >
                                                                    <Info size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Limit popover modal */}
            <AnimatePresence>
                {limitModal && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setLimitModal(null)}
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <SlidersHorizontal size={18} className="text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        Set Feature Limit
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {filteredSections.flatMap(s => s.features).find(f => f.id === limitModal.featureId)?.label || limitModal.featureId}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                    Maximum Limit
                                </label>
                                <input
                                    type="number"
                                    value={limitInput}
                                    onChange={(e) => setLimitInput(e.target.value)}
                                    min={1}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                    autoFocus
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                    Set 0 to disable, or leave blank for unlimited (switch to Yes)
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLimitModal(null)}
                                    className="flex-1 h-11 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveLimit}
                                    className="flex-1 h-11 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                                >
                                    Apply Limit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
