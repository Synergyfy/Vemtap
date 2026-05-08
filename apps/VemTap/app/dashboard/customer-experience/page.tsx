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
import { useCatalogueItems, useCatalogueOffersAdmin } from '@/services/catalogue/hooks';
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
    Gift,
    Info,
    Check,
    AlertCircle,
} from 'lucide-react';

// New unified components
import { BuilderSectionCard } from './components/BuilderSectionCard';
import { ExperienceLinkCard } from './components/ExperienceLinkCard';
import { PublishBar } from './components/PublishBar';
import { VisitorFormSection } from './components/VisitorFormSection';
import { DefaultSuccessSection } from './components/DefaultSuccessSection';
import { EmptyContentModal } from './components/EmptyContentModal';

// Visitor Preview Components
import { StepForm } from '@/components/visitor/StepForm';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import { PortalWelcome } from '@/components/visitor/PortalWelcome';

// === Dynamic System Actions for UBL ===
const SYSTEM_ACTIONS = [
    { id: 'system:order', title: 'Products', subtitle: 'Showcase your product catalog', icon: <ShoppingBag size={18} />, type: 'product' },
    { id: 'system:service', title: 'Services', subtitle: 'List your service offerings', icon: <Wrench size={18} />, type: 'service' },
    { id: 'system:offers', title: 'Offers', subtitle: 'Exclusive hot deals', icon: <Gift size={18} />, type: 'offer' },
    { id: 'system:booking', title: 'Booking', subtitle: 'Let customers book appointments', icon: <CalendarDays size={18} />, type: 'booking' },
    { id: 'system:whatsapp', title: 'WhatsApp Chat', subtitle: 'Direct messaging channel', icon: <MessageCircle size={18} />, type: 'whatsapp' },
    { id: 'system:forms', title: 'Feedback', subtitle: 'General feedback form', icon: <FileText size={18} />, type: 'forms' },
    { id: 'system:engagement', title: 'Social Links', subtitle: 'Connect your social profiles', icon: <Share2 size={18} />, type: 'social' },
];
const DEFAULT_UBL_SEQUENCE = ['system:order', 'system:service', 'system:offers', 'system:booking', 'system:whatsapp', 'system:engagement'];
const SYSTEM_ACTION_MAP = new Map(SYSTEM_ACTIONS.map(a => [a.id, a]));

const VISITOR_FORM_DEF = { id: 'visitor-form', title: 'Visitor Form', subtitle: 'Collect customer data before they start', icon: <Users size={18} />, expandable: true };
const DEFAULT_SUCCESS_DEF = { id: 'default-success', title: 'Default Success', subtitle: 'Customize the goal screen after check-in', icon: <Check size={18} />, expandable: true };

export default function CustomerExperiencePage() {
    const [previewMode, setPreviewMode] = useState<'mobile' | 'web'>('mobile');
    const [previewTab, setPreviewTab] = useState<'check-in' | 'returning' | 'outcome' | 'ubl'>('ubl');
    const [formAccess, setFormAccess] = useState<'required' | 'skip'>('required');
    const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');

    // Inline title editing state
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [editLabelValue, setEditLabelValue] = useState('');

    // Validation Modal State
    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        actionLabel: string;
        actionHref: string;
        icon: any;
    }>({
        isOpen: false,
        title: '',
        description: '',
        actionLabel: '',
        actionHref: '',
        icon: AlertCircle
    });

    // Category expansion state
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        active: false,
        system: false,
        forms: false,
        rewards: false,
        qrs: false
    });

    // Section enable/disable state for local un-synced items
    const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
        'visitor-form': true,
        'default-success': true,
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
    const { 
        engagementSettings, 
        getBusinessConfig, 
        hasRewardSetup, 
        updateEngagementSettings,
        customSuccessTitle,
        customSuccessMessage
    } = useCustomerFlowStore();
    const updateBranchMutation = useUpdateBranch();

    const activeBranch = branches.find((b: any) => b.id === activeBranchId);
    const brandColor = engagementSettings?.brandColor || (activeBranch as any)?.formAppearanceColor || business?.brandColor || '#2563eb';
    const brandVars = useMemo(() => buildBrandCssVars(brandColor), [brandColor]);

    const resolvedBranchId = activeBranchId || undefined;
    
    // Content Data Fetching for Validation
    const { data: allForms = [] } = useBusinessForms({ branchId: resolvedBranchId });
    const { data: catalogueItems = [] } = useCatalogueItems({ branchId: resolvedBranchId });
    const { data: catalogueOffers = [] } = useCatalogueOffersAdmin({ branchId: resolvedBranchId });
    
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

    // Category Tooltip Component
    const CategoryTooltip = ({ content }: { content: string }) => {
        const [show, setShow] = useState(false);
        return (
            <div className="relative inline-flex items-center ml-1.5 group/tooltip">
                <button
                    type="button"
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShow(!show);
                    }}
                    className="text-gray-300 hover:text-primary transition-colors p-0.5"
                >
                    <Info size={13} />
                </button>
                <AnimatePresence>
                    {show && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] font-bold leading-relaxed rounded-xl shadow-2xl pointer-events-none text-center"
                        >
                            {content}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

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
        if (ublSequence && Array.isArray(ublSequence)) return ublSequence;
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
            const rewardInSequence = rewards.find(r => r.id === id); // Fallback for rewards
            if (rewardInSequence) return { id: rewardInSequence.id, title: rewardInSequence.name || 'Untitled Reward', subtitle: 'Reward Strategy', icon: <Star size={18} />, type: 'reward' };
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

    // Feature Validation Logic
    const validateFeature = (id: string): boolean => {
        if (!id.startsWith('system:')) return true;

        switch (id) {
            case 'system:order':
                if (catalogueItems.filter(i => i.itemType === 'product').length === 0) {
                    setValidationModal({
                        isOpen: true,
                        title: 'No Products Found',
                        description: 'You haven\'t added any products to your catalogue yet. Add your first product to enable this feature.',
                        actionLabel: 'Add Your First Product',
                        actionHref: '/dashboard/catalogue/products',
                        icon: ShoppingBag
                    });
                    return false;
                }
                break;
            case 'system:service':
                if (catalogueItems.filter(i => i.itemType === 'service').length === 0) {
                    setValidationModal({
                        isOpen: true,
                        title: 'No Services Found',
                        description: 'You haven\'t added any services to your catalogue yet. Add your first service to enable this feature.',
                        actionLabel: 'Add Your First Service',
                        actionHref: '/dashboard/catalogue/products',
                        icon: Wrench
                    });
                    return false;
                }
                break;
            case 'system:offers':
                if (catalogueOffers.length === 0) {
                    setValidationModal({
                        isOpen: true,
                        title: 'No Offers Found',
                        description: 'You haven\'t created any special offers yet. Create your first offer to enable this feature.',
                        actionLabel: 'Create Your First Offer',
                        actionHref: '/dashboard/catalogue/offers',
                        icon: Gift
                    });
                    return false;
                }
                break;
            case 'system:booking':
                // Bookings are usually services that are bookable
                if (catalogueItems.filter(i => i.itemType === 'service').length === 0) {
                    setValidationModal({
                        isOpen: true,
                        title: 'No Booking Items',
                        description: 'You haven\'t added any services for booking yet. Add your first service to enable this feature.',
                        actionLabel: 'Go to Bookings',
                        actionHref: '/dashboard/catalogue/bookings',
                        icon: CalendarDays
                    });
                    return false;
                }
                break;
            case 'system:whatsapp':
                if (!(activeBranch as any)?.whatsappNumber && !(business as any)?.whatsappNumber) {
                    setValidationModal({
                        isOpen: true,
                        title: 'WhatsApp Not Configured',
                        description: 'You haven\'t added a WhatsApp number to your business profile yet. Add it now to enable direct messaging.',
                        actionLabel: 'Add WhatsApp Number',
                        actionHref: '/dashboard/settings/profile?tab=whatsapp',
                        icon: MessageCircle
                    });
                    return false;
                }
                break;
            case 'system:forms':
                if (allForms.length === 0) {
                    setValidationModal({
                        isOpen: true,
                        title: 'No Feedback Forms',
                        description: 'You haven\'t created any feedback forms yet. Create your first form to enable this feature.',
                        actionLabel: 'Create Your First Form',
                        actionHref: '/dashboard/engagement/forms',
                        icon: FileText
                    });
                    return false;
                }
                break;
            case 'system:engagement':
                const hasSocial = engagementSettings?.instagram || engagementSettings?.facebook || engagementSettings?.twitter || engagementSettings?.linkedin;
                if (!hasSocial) {
                    setValidationModal({
                        isOpen: true,
                        title: 'No Social Links',
                        description: 'You haven\'t connected any social media profiles yet. Add your links to enable this feature.',
                        actionLabel: 'Add Social Links',
                        actionHref: '/dashboard/settings/profile?tab=socials',
                        icon: Share2
                    });
                    return false;
                }
                break;
        }

        return true;
    };

    // Section toggle handler
    const toggleSection = (id: string, enabled: boolean) => {
        if (id === 'visitor-form') {
            setSectionStates(prev => ({ ...prev, [id]: enabled }));
            if (enabled) setPreviewTab('check-in');
            return;
        }
        if (id === 'default-success') {
            setSectionStates(prev => ({ ...prev, [id]: enabled }));
            if (enabled) setPreviewTab('outcome');
            return;
        }

        // Validate before enabling
        if (enabled && !validateFeature(id)) {
            return;
        }

        let newSequence = [...effectiveSequence];
        if (enabled && !newSequence.includes(id)) {
            newSequence.push(id);
        } else if (!enabled && newSequence.includes(id)) {
            newSequence = newSequence.filter(itemId => itemId !== id);
        }
        updateEngagementSettings({ ublSequence: newSequence });
        if (enabled) setPreviewTab('ubl');
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
                    onFocus={() => setPreviewTab('ubl')}
                />
            </div>
        );
    };

    const categoryDescriptions: Record<string, string> = {
        'active': 'Features currently visible on your link. Drag to change the order.',
        'system': 'Core VemTap features like Product Catalogs and WhatsApp integration.',
        'qrs': 'Dynamic QR codes for PDFs, Images, or Custom Links from QR Thrive.',
        'forms': 'Custom feedback or data collection forms you have created.',
        'rewards': 'Active loyalty programs and rewards for your customers.'
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
                        <CategoryTooltip content={categoryDescriptions[catId] || 'Section description'} />
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
                                title={
                                    <div className="flex items-center">
                                        {VISITOR_FORM_DEF.title}
                                        <CategoryTooltip content="The check-in form customers fill out to identify themselves when they arrive." />
                                    </div>
                                }
                                subtitle={VISITOR_FORM_DEF.subtitle}
                                icon={VISITOR_FORM_DEF.icon}
                                enabled={sectionStates['visitor-form'] ?? true}
                                onToggle={(val) => toggleSection('visitor-form', val)}
                                defaultExpanded={false}
                                showDragHandle={false}
                                onFocus={() => setPreviewTab('check-in')}
                            >
                                <VisitorFormSection
                                    formAccess={formAccess}
                                    onFormAccessChange={setFormAccess}
                                />
                            </BuilderSectionCard>
                        </div>

                        {/* Static Default Success Section */}
                        <div className="mb-6">
                            <BuilderSectionCard
                                id={DEFAULT_SUCCESS_DEF.id}
                                title={
                                    <div className="flex items-center">
                                        {DEFAULT_SUCCESS_DEF.title}
                                        <CategoryTooltip content="Customize the messages shown to customers when they successfully check in." />
                                    </div>
                                }
                                subtitle={DEFAULT_SUCCESS_DEF.subtitle}
                                icon={DEFAULT_SUCCESS_DEF.icon}
                                enabled={sectionStates['default-success'] ?? true}
                                onToggle={(val) => toggleSection('default-success', val)}
                                defaultExpanded={false}
                                showDragHandle={false}
                                onFocus={() => setPreviewTab('outcome')}
                            >
                                <DefaultSuccessSection />
                            </BuilderSectionCard>
                        </div>

                        {/* Categorized UBL Items */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setExpandedCategories(p => ({ ...p, active: !p.active }))}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-300",
                                    expandedCategories.active 
                                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                                        : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-[11px] font-black uppercase tracking-[0.15em] transition-colors",
                                        expandedCategories.active ? "text-primary" : "text-gray-500"
                                    )}>
                                        Active Display Items
                                    </span>
                                    <CategoryTooltip content={categoryDescriptions['active']} />
                                    {groupedItems.active.length > 0 && (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-black transition-colors",
                                            expandedCategories.active ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                                        )}>
                                            {groupedItems.active.length}
                                        </span>
                                    )}
                                </div>
                                <div className={cn(
                                    "size-6 rounded-full flex items-center justify-center transition-all",
                                    expandedCategories.active ? "bg-primary text-white rotate-180" : "bg-gray-50 text-gray-400"
                                )}>
                                    <ChevronDown size={14} />
                                </div>
                            </button>
                            <AnimatePresence>
                                {expandedCategories.active && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-4 pb-4 pt-1 px-1">
                                            {/* Portal Header Configuration */}
                                            <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm space-y-4">
                                                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-3">
                                                    <LayoutDashboard size={14} className="text-primary" />
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main">Portal Header Configuration</h4>
                                                </div>
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">Welcome Title</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="text" 
                                                                placeholder={`Welcome to ${previewBusinessName}`}
                                                                maxLength={35}
                                                                value={engagementSettings?.customWelcomeTitle || ''}
                                                                onChange={(e) => updateEngagementSettings({ customWelcomeTitle: e.target.value })}
                                                                className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-300">
                                                                {(engagementSettings?.customWelcomeTitle || '').length}/35
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">Welcome Subtitle</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Select an option below"
                                                                maxLength={60}
                                                                value={engagementSettings?.customWelcomeMessage || ''}
                                                                onChange={(e) => updateEngagementSettings({ customWelcomeMessage: e.target.value })}
                                                                className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-300">
                                                                {(engagementSettings?.customWelcomeMessage || '').length}/60
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-gray-400 italic font-medium px-1">
                                                    * These fields customize the top section of your mobile portal preview.
                                                </p>
                                            </div>

                                            {/* Draggable Active Items */}
                                            <div className="space-y-3">
                                                {displayOrder.map(id => {
                                                    const d = groupedItems.active.find(i => i.id === id);
                                                    return d ? renderItem(d, true) : null;
                                                })}
                                                {groupedItems.active.length === 0 && (
                                                    <div className="py-8 px-4 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center bg-gray-50/30">
                                                        <p className="text-xs font-bold text-gray-400">No active UBL items</p>
                                                        <p className="text-[10px] text-gray-300 mt-1 max-w-[180px]">Toggle items from the categories below to show them on your link.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

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
                                            onBack={() => setPreviewTab('ubl')}
                                            onSubmit={() => {
                                                const hasSuccessSection = sectionStates['default-success'] ?? true;
                                                if (hasSuccessSection) {
                                                    setPreviewTab('outcome');
                                                    setTimeout(() => setPreviewTab('ubl'), 3000);
                                                } else {
                                                    setPreviewTab('ubl');
                                                }
                                            }}
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
                                            onFinish={() => setPreviewTab('ubl')}
                                            onRestart={() => setPreviewTab('check-in')}
                                            customSuccessTitle={engagementSettings?.customSuccessTitle || customSuccessTitle}
                                            customSuccessDescription={engagementSettings?.customSuccessMessage || customSuccessMessage}
                                            isPreview={true}
                                        />
                                    )}
                                    {previewTab === 'ubl' && (
                                        <PortalWelcome
                                            branchName={previewBusinessName}
                                            logoUrl={previewBusinessLogo}
                                            welcomeTitle={engagementSettings?.customWelcomeTitle || undefined}
                                            welcomeMessage={engagementSettings?.customWelcomeMessage || undefined}
                                            onAction={() => {}}
                                            productCount={catalogueItems.filter(i => i.itemType === 'product').length}
                                            serviceCount={catalogueItems.filter(i => i.itemType === 'service').length}
                                            offerCount={catalogueOffers.length}
                                            formCount={allForms.length}
                                            engagement={engagementSettings}
                                            whatsappNumber={(activeBranch as any)?.whatsappNumber || (business as any)?.whatsappNumber || '1234567890'}
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

            {/* Validation Modal */}
            <EmptyContentModal
                isOpen={validationModal.isOpen}
                onClose={() => setValidationModal(prev => ({ ...prev, isOpen: false }))}
                title={validationModal.title}
                description={validationModal.description}
                actionLabel={validationModal.actionLabel}
                actionHref={validationModal.actionHref}
                icon={validationModal.icon}
            />
        </div>
    );
}
