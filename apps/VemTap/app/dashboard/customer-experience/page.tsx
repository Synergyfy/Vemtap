'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches, useUpdateBranch } from '@/services/branches/hooks';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { buildBrandCssVars } from '@/lib/brandColor';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchDevices } from '@/lib/api/devices';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { toast } from 'react-hot-toast';
import {
    Users,
    ShoppingBag,
    Wrench,
    CalendarDays,
    MessageCircle,
    FileText,
    Star,
    Share2,
    Smartphone,
    Monitor,
    Settings2,
    Copy,
    QrCode,
    ChevronDown,
    Eye,
    LayoutDashboard,
} from 'lucide-react';

// New unified components
import { BuilderSectionCard } from './components/BuilderSectionCard';
import { ExperienceLinkCard } from './components/ExperienceLinkCard';
import { PublishBar } from './components/PublishBar';
import { VisitorFormSection } from './components/VisitorFormSection';

// Visitor Preview Components
import { StepForm } from '@/components/visitor/StepForm';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import { PortalWelcome } from '@/components/visitor/PortalWelcome';

// === Dynamic System Actions for UBL ===
const SYSTEM_ACTIONS = [
    { id: 'system:order', title: 'Products', subtitle: 'Showcase your product catalog', icon: <ShoppingBag size={18} /> },
    { id: 'system:service', title: 'Services', subtitle: 'List your service offerings', icon: <Wrench size={18} /> },
    { id: 'system:booking', title: 'Booking', subtitle: 'Let customers book appointments', icon: <CalendarDays size={18} /> },
    { id: 'system:whatsapp', title: 'WhatsApp Chat', subtitle: 'Direct messaging channel', icon: <MessageCircle size={18} /> },
    { id: 'system:forms', title: 'Feedback', subtitle: 'General feedback form', icon: <FileText size={18} /> },
    { id: 'system:engagement', title: 'Social Links', subtitle: 'Connect your social profiles', icon: <Share2 size={18} /> },
];
const DEFAULT_UBL_SEQUENCE = ['system:order', 'system:service', 'system:booking', 'system:whatsapp', 'system:engagement'];
const SYSTEM_ACTION_MAP = new Map(SYSTEM_ACTIONS.map(a => [a.id, a]));

const VISITOR_FORM_DEF = { id: 'visitor-form', title: 'Visitor Form', subtitle: 'Collect customer data before they start', icon: <Users size={18} />, expandable: true };

export default function CustomerExperiencePage() {
    const [previewMode, setPreviewMode] = useState<'mobile' | 'web'>('mobile');
    const [previewTab, setPreviewTab] = useState<'check-in' | 'returning' | 'outcome' | 'ubl'>('ubl');
    const [formAccess, setFormAccess] = useState<'required' | 'skip'>('required');
    const [activeFields, setActiveFields] = useState(['Name', 'Phone', 'Email']);
    const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');

    // Inline title editing state
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [editLabelValue, setEditLabelValue] = useState('');

    // Category expansion state
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        active: true,
        system: false,
        forms: false,
        rewards: false,
        qrs: false
    });

    // Section enable/disable state for local un-synced items
    const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
        'visitor-form': true,
    });

    // Local reordering state to prevent jank during drag
    const [localOrder, setLocalOrder] = useState<string[] | null>(null);

    // Drag state
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const { user } = useAuthStore();
    const { activeBranchId } = useActiveBranch();
    const { data: business } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    const { engagementSettings, getBusinessConfig, hasRewardSetup, updateEngagementSettings } = useCustomerFlowStore();
    const updateBranchMutation = useUpdateBranch();

    const activeBranch = branches.find((b: any) => b.id === activeBranchId);
    const brandColor = engagementSettings?.brandColor || (activeBranch as any)?.formAppearanceColor || business?.brandColor || '#2563eb';
    const brandVars = useMemo(() => buildBrandCssVars(brandColor), [brandColor]);

    const resolvedBranchId = activeBranchId || undefined;
    const { data: allForms = [] } = useBusinessForms({ branchId: resolvedBranchId });
    const { data: qrCodes = [] } = useQuery<any[]>({
        queryKey: ['qr-thrive-codes', resolvedBranchId],
        queryFn: async () => {
            if (!resolvedBranchId) return [];
            const response = await api.get(`/qr-thrive/branches/${resolvedBranchId}/qr-codes`);
            return response?.data || response || [];
        },
        enabled: !!resolvedBranchId
    });
    const { data: rewards = [] } = useQuery<any[]>({
        queryKey: ['loyalty-rewards', resolvedBranchId],
        queryFn: async () => {
            if (!resolvedBranchId) return [];
            const response = await api.get(`/loyalty/rewards/branches/${resolvedBranchId}`);
            return response?.data || response || [];
        },
        enabled: !!resolvedBranchId
    });

    const { data: devices = [] } = useQuery({
        queryKey: ['devices', user?.businessId, resolvedBranchId, false],
        queryFn: () => fetchDevices(resolvedBranchId || undefined, false)
    });

    const previewBusinessName = (activeBranch as any)?.name || business?.name || 'Your Business';
    const previewBusinessLogo = business?.logoUrl || (activeBranch as any)?.logoUrl || '';
    const config = useMemo(() => getBusinessConfig(), [getBusinessConfig]);

    // Build public URL
    const [origin, setOrigin] = useState('https://vemtap.com');
    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);
    const currentBranch = branches.find((b: any) => b.id === activeBranchId) || branches.find((b: any) => b.isMainBranch);
    const slug = (currentBranch as any)?.slug || (business as any)?.slug || (user as any)?.business?.slug || (previewBusinessName !== 'Your Business' ? previewBusinessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'your-business');
    const primaryDevice = devices?.[0];
    const code = primaryDevice?.code || 'setup-pending';
    const publicUrl = `${origin}/${slug}/${code}`;

    // Construct dynamic builder items
    const availableForms = useMemo(
        () => allForms.filter((form: any) => form.isPublished && form.isActive && form.showAfterLeadCapture),
        [allForms]
    );

    const ublSequence = useMemo(
        () => engagementSettings?.ublSequence || [],
        [engagementSettings?.ublSequence]
    );

    const effectiveSequence = useMemo(() => {
        if (ublSequence.length > 0) return ublSequence;
        return [...DEFAULT_UBL_SEQUENCE];
    }, [ublSequence]);

    const groupedItems = useMemo(() => {
        const formMap = new Map(allForms.map((f: any) => [f.id, f]));
        const rewardMap = new Map(rewards.map((r: any) => [r.id, r]));
        const qrMap = new Map(qrCodes.map((q: any) => [q.id, q]));

        const activeItems = effectiveSequence.map(id => {
            const systemAction = SYSTEM_ACTION_MAP.get(id);
            if (systemAction) return { ...systemAction, type: 'system' };
            const form = formMap.get(id);
            if (form) return { id: form.id, title: form.title || 'Untitled Form', subtitle: 'Additional Form', icon: <FileText size={18} />, type: 'form' };
            const reward = rewardMap.get(id);
            if (reward) return { id: reward.id, title: reward.name || 'Untitled Reward', subtitle: 'Reward Strategy', icon: <Star size={18} />, type: 'reward' };
            const qr = qrMap.get(id);
            if (qr) return { id: qr.id, title: qr.name || 'QR Code', subtitle: qr.type?.toUpperCase() || 'QR', icon: <QrCode size={18} />, type: 'qr' };
            return null;
        }).filter(Boolean) as any[];

        const activeIds = new Set(activeItems.map(i => i.id));

        const inactiveSystem = SYSTEM_ACTIONS.filter(a => !activeIds.has(a.id)).map(a => ({ ...a, type: 'system' }));
        const inactiveForms = availableForms.filter((f: any) => !activeIds.has(f.id)).map((form: any) => ({ id: form.id, title: form.title || 'Untitled Form', subtitle: 'Additional Form', icon: <FileText size={18} />, type: 'form' }));
        const inactiveRewards = rewards.filter((r: any) => !activeIds.has(r.id)).map((reward: any) => ({ id: reward.id, title: reward.name || 'Untitled Reward', subtitle: 'Reward Strategy', icon: <Star size={18} />, type: 'reward' }));
        const inactiveQrs = qrCodes.filter((q: any) => !activeIds.has(q.id)).map((qr: any) => ({ id: qr.id, title: qr.name || 'QR Code', subtitle: qr.type?.toUpperCase() || 'QR', icon: <QrCode size={18} />, type: 'qr' }));

        return {
            active: activeItems,
            system: inactiveSystem,
            forms: inactiveForms,
            rewards: inactiveRewards,
            qrs: inactiveQrs
        };
    }, [effectiveSequence, allForms, availableForms, rewards, qrCodes]);

    const displayOrder = localOrder || groupedItems.active.map(i => i.id);

    // Section toggle handler
    const toggleSection = (id: string, enabled: boolean) => {
        if (id === 'visitor-form') {
            setSectionStates(prev => ({ ...prev, [id]: enabled }));
            return;
        }

        let newSequence = [...effectiveSequence];
        if (enabled && !newSequence.includes(id)) {
            newSequence.push(id);
        } else if (!enabled && newSequence.includes(id)) {
            newSequence = newSequence.filter(itemId => itemId !== id);
        }
        updateEngagementSettings({ ublSequence: newSequence });
        setLocalOrder(null); // Reset local order to sync with new sequence
    };

    // Drag handlers
    const handleDragStart = (id: string) => {
        if (id === 'visitor-form') return; // Not draggable with UBL items
        setDraggedId(id);
        setLocalOrder(displayOrder);
    };
    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (id === 'visitor-form') return;
        if (id !== draggedId) setDragOverId(id);
    };
    const handleDrop = (targetId: string) => {
        if (!draggedId || draggedId === targetId || targetId === 'visitor-form') return;
        
        const currentItems = [...displayOrder];
        const fromIdx = currentItems.indexOf(draggedId);
        const toIdx = currentItems.indexOf(targetId);
        if (fromIdx < 0 || toIdx < 0) return;

        currentItems.splice(fromIdx, 1);
        currentItems.splice(toIdx, 0, draggedId);
        
        // Find which items are toggled on, and update ublSequence with the new order
        const toggledOnIds = currentItems.filter(id => effectiveSequence.includes(id));
        updateEngagementSettings({ ublSequence: toggledOnIds });
        
        setLocalOrder(currentItems);
        setDraggedId(null);
        setDragOverId(null);
        setTimeout(() => setLocalOrder(null), 100); // Clear local order to resume deriving from props
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleSaveLabel = (id: string) => {
        if (!editLabelValue.trim()) {
            setEditingLabelId(null);
            return;
        }
        const currentLabels = engagementSettings?.ublSequenceLabels || {};
        updateEngagementSettings({
            ublSequenceLabels: {
                ...currentLabels,
                [id]: editLabelValue.trim()
            }
        });
        setEditingLabelId(null);
    };

    const renderItem = (def: any, isActiveGroup: boolean) => {
        const sectionId = def.id;
        const isEnabled = effectiveSequence.includes(sectionId);
        const isDragging = draggedId === sectionId;
        const isDragOver = dragOverId === sectionId;
        const isEditing = editingLabelId === sectionId;
        
        const customLabels = engagementSettings?.ublSequenceLabels || {};
        const displayTitle = customLabels[sectionId] || def.title;

        return (
            <div
                key={sectionId}
                draggable={isActiveGroup && !isEditing}
                onDragStart={() => isActiveGroup && handleDragStart(sectionId)}
                onDragOver={(e) => isActiveGroup && handleDragOver(e, sectionId)}
                onDrop={() => isActiveGroup && handleDrop(sectionId)}
                onDragEnd={() => isActiveGroup && handleDragEnd()}
                className={cn(
                    'transition-all duration-200',
                    isActiveGroup && !isEditing && 'cursor-grab active:cursor-grabbing',
                    isDragging && 'opacity-40 scale-[0.98]',
                    isDragOver && 'ring-2 ring-primary/30 ring-offset-2 rounded-2xl'
                )}
            >
                <BuilderSectionCard
                    id={sectionId}
                    title={displayTitle}
                    subtitle={def.subtitle}
                    icon={def.icon}
                    enabled={isEnabled}
                    onToggle={(val) => toggleSection(sectionId, val)}
                    onEditClick={() => {
                        setEditingLabelId(sectionId);
                        setEditLabelValue(displayTitle);
                    }}
                    isEditing={isEditing}
                    editValue={editLabelValue}
                    onEditValueChange={setEditLabelValue}
                    onSaveEdit={() => handleSaveLabel(sectionId)}
                    onCancelEdit={() => setEditingLabelId(null)}
                    editLabel="Rename"
                    defaultExpanded={false}
                    showDragHandle={isActiveGroup}
                />
            </div>
        );
    };

    const renderCategory = (title: string, catId: string, items: any[], isActiveGroup = false) => {
        if (!isActiveGroup && items.length === 0) return null;
        const isExpanded = expandedCategories[catId];
        
        return (
            <div className="space-y-2">
                <button
                    onClick={() => setExpandedCategories(p => ({ ...p, [catId]: !p[catId] }))}
                    className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-300",
                        isExpanded 
                            ? "bg-primary/5 border-primary/20 shadow-sm" 
                            : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "text-[11px] font-black uppercase tracking-[0.15em] transition-colors",
                            isExpanded ? "text-primary" : "text-gray-500"
                        )}>
                            {title}
                        </span>
                        {items.length > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black transition-colors",
                                isExpanded ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                            )}>
                                {items.length}
                            </span>
                        )}
                    </div>
                    <div className={cn(
                        "size-6 rounded-full flex items-center justify-center transition-all",
                        isExpanded ? "bg-primary text-white rotate-180" : "bg-gray-50 text-gray-400"
                    )}>
                        <ChevronDown size={14} />
                    </div>
                </button>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-3 pb-4 pt-1 px-1">
                                {isActiveGroup 
                                    ? displayOrder.map(id => {
                                        const d = items.find(i => i.id === id);
                                        return d ? renderItem(d, true) : null;
                                    })
                                    : items.map(d => renderItem(d, false))
                                }
                                {isActiveGroup && items.length === 0 && (
                                    <div className="py-8 px-4 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center bg-gray-50/30">
                                        <p className="text-xs font-bold text-gray-400">No active UBL items</p>
                                        <p className="text-[10px] text-gray-300 mt-1 max-w-[180px]">Toggle items from the categories below to show them on your link.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Save/publish handlers
    const handleSaveDraft = useCallback(async () => {
        if (!resolvedBranchId) return;
        try {
            await updateBranchMutation.mutateAsync({
                id: resolvedBranchId,
                updates: { engagement: engagementSettings }
            });
            toast.success('Draft saved successfully');
        } catch {
            toast.error('Failed to save draft');
        }
    }, [resolvedBranchId, engagementSettings, updateBranchMutation]);

    const handlePublish = useCallback(async () => {
        if (!resolvedBranchId) return;
        try {
            await updateBranchMutation.mutateAsync({
                id: resolvedBranchId,
                updates: { engagement: engagementSettings }
            });
            toast.success('Experience published!');
        } catch {
            toast.error('Failed to publish');
        }
    }, [resolvedBranchId, engagementSettings, updateBranchMutation]);

    return (
        <div className="max-w-[1600px] mx-auto pb-32 xl:pb-8 p-4 md:p-8">
            <PageHeader 
                title="Customer Experience" 
                description="Build and customize your business journey"
                actions={
                    <div className="hidden md:block">
                        <PublishBar onSaveDraft={handleSaveDraft} onPublish={handlePublish} />
                    </div>
                }
            />

            <div className="flex flex-col xl:flex-row gap-8 items-start relative mt-8">
                {/* ========== LEFT: Builder Area ========== */}
                <div className={cn(
                    "flex-1 w-full space-y-6 transition-all duration-300",
                    mobileView === 'preview' ? "hidden xl:block" : "block"
                )}>
                    <ExperienceLinkCard publicUrl={publicUrl} businessLogo={previewBusinessLogo} />

                    {/* Builder Sections */}
                    <div className="space-y-1">
                        {/* Static Visitor Form Section */}
                        <div className="mb-6">
                            <BuilderSectionCard
                                id={VISITOR_FORM_DEF.id}
                                title={VISITOR_FORM_DEF.title}
                                subtitle={VISITOR_FORM_DEF.subtitle}
                                icon={VISITOR_FORM_DEF.icon}
                                enabled={sectionStates['visitor-form'] ?? true}
                                onToggle={(val) => toggleSection('visitor-form', val)}
                                defaultExpanded={true}
                                showDragHandle={false}
                            >
                                <VisitorFormSection
                                    formAccess={formAccess}
                                    onFormAccessChange={setFormAccess}
                                    activeFields={activeFields}
                                    onRemoveField={(field) => setActiveFields(prev => prev.filter(f => f !== field))}
                                    onAddField={() => toast('Add field dialog coming soon')}
                                />
                            </BuilderSectionCard>
                        </div>

                        {/* Categorized UBL Items */}
                        {renderCategory('Active Display Items', 'active', groupedItems.active, true)}
                        {renderCategory('System Features', 'system', groupedItems.system)}
                        {renderCategory('QR Thrive Codes', 'qrs', groupedItems.qrs)}
                        {renderCategory('Additional Forms', 'forms', groupedItems.forms)}
                        {renderCategory('Loyalty Rewards', 'rewards', groupedItems.rewards)}
                    </div>
                </div>

                {/* ========== RIGHT: Live Phone Preview ========== */}
                <div className={cn(
                    "w-full xl:w-[400px] xl:sticky xl:top-8 shrink-0 transition-all duration-300",
                    mobileView === 'edit' ? "hidden xl:block" : "block"
                )}>
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-5 flex flex-col items-center">
                        {/* Preview Header */}
                        <div className="w-full flex items-center justify-between mb-5 px-1">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
                                    Live Preview
                                </p>
                            </div>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto max-w-[200px] scrollbar-hide">
                                {[
                                    { id: 'ubl', label: 'Menu' },
                                    { id: 'check-in', label: 'New' },
                                    { id: 'returning', label: 'Back' },
                                    { id: 'outcome', label: 'Goal' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setPreviewTab(tab.id as any)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                                            previewTab === tab.id
                                                ? 'bg-white text-primary shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Phone Frame */}
                        <div style={brandVars} className="w-full flex justify-center">
                            <PhoneFrame>
                                <div className="h-full origin-top">
                                    {previewTab === 'check-in' && (
                                        <StepForm
                                            storeName={previewBusinessName}
                                            logoUrl={previewBusinessLogo}
                                            customWelcomeMessage={(engagementSettings as any)?.customWelcomeMessage || undefined}
                                            customWelcomeTitle={(engagementSettings as any)?.customWelcomeTitle || undefined}
                                            customWelcomeTag={(engagementSettings as any)?.customWelcomeTag || undefined}
                                            customPrivacyMessage={(engagementSettings as any)?.customPrivacyMessage || undefined}
                                            submitLabel={(engagementSettings as any)?.submitLabel || undefined}
                                            isPreview={true}
                                            onBack={() => {}}
                                            onSubmit={() => {}}
                                        />
                                    )}
                                    {previewTab === 'returning' && (
                                        <StepWelcomeBack
                                            storeName={previewBusinessName}
                                            userData={{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }}
                                            visitCount={3}
                                            rewardVisitThreshold={5}
                                            hasRewardSetup={hasRewardSetup}
                                            redemptionStatus="none"
                                            onRedeem={() => {}}
                                            onContinue={() => {}}
                                            onClear={() => {}}
                                            isPreview={true}
                                        />
                                    )}
                                    {previewTab === 'outcome' && (
                                        <StepOutcome
                                            config={config}
                                            hasRewardSetup={hasRewardSetup}
                                            isDownloading={false}
                                            onDownload={() => {}}
                                            onFinish={() => {}}
                                            onRestart={() => {}}
                                            engagementSettings={{ ...engagementSettings, isPreview: true }}
                                            isPreview={true}
                                        />
                                    )}
                                    {previewTab === 'ubl' && (
                                        <PortalWelcome
                                            branchName={previewBusinessName}
                                            logoUrl={previewBusinessLogo}
                                            welcomeMessage={(engagementSettings as any)?.customWelcomeMessage || undefined}
                                            onAction={() => {}}
                                            productCount={1}
                                            serviceCount={1}
                                            offerCount={1}
                                            formCount={1}
                                            engagement={engagementSettings}
                                            whatsappNumber={'1234567890'}
                                            qrThriveCodes={qrCodes}
                                            availableForms={allForms}
                                            availableRewards={rewards}
                                            ublSequence={engagementSettings?.ublSequence}
                                            brandColor={brandColor}
                                            isPreview={true}
                                        />
                                    )}
                                </div>
                            </PhoneFrame>
                        </div>

                         {/* Sandbox Note */}
                         <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 w-full text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <Settings2 size={12} className="text-primary" />
                                <p className="text-[10px] text-gray-800 font-black uppercase tracking-[0.15em]">Interactive Sandbox</p>
                            </div>
                            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                Toggle sections on the left to see changes <span className="text-primary font-bold">instantly</span> in the preview.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== Unified Mobile Action Bar ========== */}
            <div className="xl:hidden">
                <PublishBar 
                    onSaveDraft={handleSaveDraft} 
                    onPublish={handlePublish}
                    leftElement={
                        <div className="flex bg-gray-100/50 p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setMobileView('edit')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    mobileView === 'edit' 
                                        ? "bg-white text-primary shadow-sm" 
                                        : "text-gray-400"
                                )}
                            >
                                <LayoutDashboard size={12} />
                                Build
                            </button>
                            <button
                                onClick={() => setMobileView('preview')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    mobileView === 'preview' 
                                        ? "bg-white text-primary shadow-sm" 
                                        : "text-gray-400"
                                )}
                            >
                                <Eye size={12} />
                                View
                            </button>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
