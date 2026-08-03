'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
    featureSupportsLimit,
} from '@/lib/planPermissions';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { useUpdatePlanPermissions } from '@/services/pricing/hooks';

interface PlanPermissionsTabProps {
    plans: PricingPlan[];
    isLoading: boolean;
}

export default function PlanPermissionsTab({ plans, isLoading }: PlanPermissionsTabProps) {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
    const [configs, setConfigs] = useState<Record<string, PlanPermissionConfig>>({});

    // Tracks only the fields the user has explicitly edited.
    // This acts as the Update DTO — only what's changed gets sent in the PATCH payload.
    const [pendingChanges, setPendingChanges] = useState<Partial<PricingPlan>>({});

    // Normalise nav-tree feature IDs to canonical config IDs used by mapConfigToPlanDto
    const FEATURE_ID_ALIASES: Record<string, string> = { branches: 'locations' };

    const getAliasUpdates = useCallback((featureId: string, level: PermissionLevel, limit?: number): Record<string, FeaturePermission> => {
        const canonicalId = FEATURE_ID_ALIASES[featureId];
        if (!canonicalId) return {};
        return { [canonicalId]: { level, limit: limit ?? undefined } as FeaturePermission };
    }, []);

    // Maps a feature change to its corresponding PricingPlan fields.
    // This mirrors the backend pattern: Update DTO = Partial<Create DTO>.
    const getPlanFieldUpdates = useCallback((
        featureId: string,
        level: PermissionLevel,
        limit?: number
    ): Partial<PricingPlan> => {
        // Normalise nav-tree IDs to canonical feature IDs used in mapPlanToConfig
        const canonicalId = (
            { branches: 'locations' } as Record<string, string>
        )[featureId] || featureId;

        switch (canonicalId) {
            case 'catalogue':
                return {
                    catalogueEnabled: level !== 'no',
                    maxCatalogueItems: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 50) : null),
                };
            case 'inventory':
                return {
                    inventoryEnabled: level !== 'no',
                    inventoryLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 50) : null),
                };
            case 'pos':
                return {
                    posEnabled: level !== 'no',
                    posTerminalLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 1) : null),
                };
            case 'loyalty':
                return {
                    loyaltyEnabled: level !== 'no',
                    loyaltyLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 1) : null),
                };
            case 'visitors':
                return { visitorsEnabled: level === 'yes' };
            case 'in-app-chat':
                return { inAppChatEnabled: level === 'yes' };
            case 'channels':
                return { messagingEnabled: level === 'yes' };
            case 'forms':
                return {
                    formsEnabled: level !== 'no',
                    formsLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 50) : null),
                };
            case 'business-qr':
                return { businessQrEnabled: level === 'yes' };
            case 'marketing-kit':
                return {
                    marketingKitEnabled: level !== 'no',
                    marketingKitLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 5) : null),
                };
            case 'discovery':
                return { discoveryEnabled: level === 'yes' };
            case 'analytics':
                return level === 'no'
                    ? { analyticsEnabled: false, analyticsLevel: 'none' as const }
                    : { analyticsEnabled: true, analyticsLevel: level === 'yes' ? 'advanced' as const : 'basic' as const };
            case 'staff':
                return {
                    teamMembersEnabled: level !== 'no',
                    teamMembersLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 1) : null),
                };
            case 'staff-roles':
                return {
                    staffRolesEnabled: level !== 'no',
                    staffRolesLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 1) : null),
                };
            case 'activity-log':
                return { activityLogEnabled: level === 'yes' };
            case 'locations':
                return {
                    branchesEnabled: level !== 'no',
                    branchLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 1) : null),
                };
            case 'qr-codes':
                return {
                    qrCodesEnabled: level !== 'no',
                    qrCodesLimit: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 5) : null),
                };
            case 'ai-copilot':
                return {
                    aiCopilotEnabled: level !== 'no',
                    aiCredits: level === 'yes' ? -1 : (level === 'limited' ? (limit ?? 50) : null),
                };
            default:
                return {};
        }
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
                newConfigs[key] = mapPlanToConfig(plan);
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

    // Clear pending changes when switching to a different plan
    React.useEffect(() => {
        setPendingChanges({});
    }, [selectedPlanId]);

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
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    }, []);

    const toggleParent = useCallback((parentId: string) => {
        setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
    }, []);

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
                        ...getAliasUpdates(featureId, level, newLimit),
                    },
                },
            };
        });
        setPendingChanges(prev => ({ ...prev, ...getPlanFieldUpdates(featureId, level) }));
    }, [selectedPlanId, getPlanFieldUpdates, getAliasUpdates]);

    const toggleFeature = useCallback((featureId: string) => {
        if (!selectedPlanId || !config) return;
        const current = config.features[featureId]?.level || 'no';
        setFeatureLevel(featureId, current === 'no' ? 'yes' : 'no');
    }, [selectedPlanId, config, setFeatureLevel]);

    const updateLimit = useCallback((featureId: string, value: number) => {
        if (!selectedPlanId) return;
        const val = isNaN(value) || value < 1 ? 1 : value;
        setConfigs(prev => {
            const plan = prev[selectedPlanId];
            if (!plan) return prev;
            return {
                ...prev,
                [selectedPlanId]: {
                    ...plan,
                    features: {
                        ...plan.features,
                        [featureId]: { level: 'limited', limit: val },
                        ...getAliasUpdates(featureId, 'limited', val),
                    },
                },
            };
        });
        setPendingChanges(prev => ({ ...prev, ...getPlanFieldUpdates(featureId, 'limited', val) }));
    }, [selectedPlanId, getPlanFieldUpdates, getAliasUpdates]);

    const resetPlanDefaults = useCallback(() => {
        if (!selectedPlan) return;
        const defaults = buildDefaultPermissions(selectedPlan.name, selectedPlan.id);
        setConfigs(prev => ({ ...prev, [selectedPlan.id]: defaults }));
        setPendingChanges({});
        toast.success(`${selectedPlan.name} permissions reset to defaults`);
    }, [selectedPlan]);

    const handleSave = useCallback(async () => {
        if (!selectedPlanId || !selectedPlan) return;
        const dto = pendingChanges;
        if (Object.keys(dto).length === 0) {
            toast('No changes to save');
            return;
        }
        try {
            await updatePermissionsMutation.mutateAsync({
                planId: selectedPlanId,
                permissions: dto
            });
            setPendingChanges({});
        } catch (err) {
            console.error('Failed to save plan permissions:', err);
        }
    }, [selectedPlanId, selectedPlan, pendingChanges, updatePermissionsMutation]);

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
            <p className="text-[10px] font-bold text-amber-600 bg-amber-50/80 rounded-xl px-4 py-2 -mb-2">
                Toggle a feature on, then type a number in the <span className="font-black">amber box</span> to set a limit. <span className="font-black">Leave it blank</span> for unlimited access.
            </p>
            <div className="space-y-4">
                {filteredSections.map(section => {
                    const sectionConfig = config;
                    const isSectionExpanded = expandedSections[section.id] ?? false;

                    // Group features by parent
                    const childrenByParent: Record<string, PlanFeature[]> = {};
                    section.features.forEach(f => {
                        if (f.parentId) {
                            if (!childrenByParent[f.parentId]) childrenByParent[f.parentId] = [];
                            childrenByParent[f.parentId].push(f);
                        }
                    });
                    const topLevelFeatures = section.features.filter(f => !f.parentId);
                    const totalFeatures = section.features.length;
                    const enabledCount = sectionConfig
                        ? section.features.filter(f => {
                            const perm = sectionConfig.features[f.id];
                            return perm && perm.level !== 'no';
                        }).length
                        : 0;

                    return (
                        <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            {/* Section header */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isSectionExpanded
                                        ? <ChevronDown size={16} className="text-gray-400" />
                                        : <ChevronRight size={16} className="text-gray-400" />
                                    }
                                    <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">
                                        {section.label}
                                    </h3>
                                    {sectionConfig && (
                                        <span className="text-[10px] font-bold text-gray-400 ml-2">
                                            {enabledCount}/{totalFeatures}
                                        </span>
                                    )}
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isSectionExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-gray-50 divide-y divide-gray-50">
                                            {topLevelFeatures.map(item => {
                                                const children = childrenByParent[item.id] || [];
                                                const hasChildren = children.length > 0;

                                                if (hasChildren) {
                                                    const isParentExpanded = expandedParents[item.id] ?? false;
                                                    const childrenEnabled = children.filter(c => {
                                                        const p = sectionConfig?.features[c.id];
                                                        return p && p.level !== 'no';
                                                    }).length;

                                                    return (
                                                        <div key={item.id}>
                                                            {/* Parent item row — click anywhere to expand */}
                                                            <button
                                                                onClick={() => toggleParent(item.id)}
                                                                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    {isParentExpanded
                                                                        ? <ChevronDown size={14} className="text-gray-400 shrink-0" />
                                                                        : <ChevronRight size={14} className="text-gray-400 shrink-0" />
                                                                    }
                                                                    <span className="text-sm font-bold text-gray-800">{item.label}</span>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-400">
                                                                    {childrenEnabled}/{children.length}
                                                                </span>
                                                            </button>

                                                            {/* Children */}
                                                            <AnimatePresence initial={false}>
                                                                {isParentExpanded && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.15 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="divide-y divide-gray-50">
                                                                            {children.map(child => {
                                                                                const childPerm = sectionConfig?.features[child.id] || { level: 'no' as PermissionLevel };
                                                                                const isOn = childPerm.level !== 'no';
                                                                                const canLimit = featureSupportsLimit(child.id);

                                                                                return (
                                                                                    <div key={child.id} className="flex items-center gap-2 px-5 py-2.5 pl-14">
                                                                                        <Switch
                                                                                            checked={isOn}
                                                                                            onCheckedChange={() => toggleFeature(child.id)}
                                                                                        />
                                                                                        <span className="text-sm font-medium text-gray-700">
                                                                                            {child.label}
                                                                                        </span>

                                                                                        {isOn && canLimit && (
                                                                                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="1"
                                                                                                    value={childPerm.limit ?? ''}
                                                                                                    onChange={(e) => {
                                                                                                        if (e.target.value === '') {
                                                                                                            setFeatureLevel(child.id, 'yes');
                                                                                                        } else {
                                                                                                            const v = parseInt(e.target.value, 10);
                                                                                                            if (!isNaN(v) && v >= 1) updateLimit(child.id, v);
                                                                                                        }
                                                                                                    }}
                                                                                                    placeholder="Unlimited"
                                                                                                    className="w-14 h-5 text-xs font-bold text-amber-800 text-center bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-amber-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                                />
                                                                                                {child.limitUnit && (
                                                                                                    <span className="text-[10px] font-bold text-amber-600">{child.limitUnit}</span>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        {isOn && !canLimit && (
                                                                                            <span className="text-[10px] font-bold text-green-600">On</span>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                }

                                                // Direct feature (no children)
                                                const perm = sectionConfig?.features[item.id] || { level: 'no' as PermissionLevel };
                                                const isOn = perm.level !== 'no';
                                                const canLimit = featureSupportsLimit(item.id);

                                                return (
                                                    <div key={item.id} className="flex items-center gap-2 px-5 py-3">
                                                        <Switch
                                                            checked={isOn}
                                                            onCheckedChange={() => toggleFeature(item.id)}
                                                        />
                                                        <span className="text-sm font-bold text-gray-800">{item.label}</span>

                                                        {isOn && canLimit && (
                                                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={perm.limit ?? ''}
                                                                    onChange={(e) => {
                                                                        if (e.target.value === '') {
                                                                            setFeatureLevel(item.id, 'yes');
                                                                        } else {
                                                                            const v = parseInt(e.target.value, 10);
                                                                            if (!isNaN(v) && v >= 1) updateLimit(item.id, v);
                                                                        }
                                                                    }}
                                                                    placeholder="Unlimited"
                                                                    className="w-14 h-5 text-xs font-bold text-amber-800 text-center bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-amber-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                {item.limitUnit && (
                                                                    <span className="text-[10px] font-bold text-amber-600">{item.limitUnit}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {isOn && !canLimit && (
                                                            <span className="text-[10px] font-bold text-green-600">On</span>
                                                        )}
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
        </div>
    );
}
