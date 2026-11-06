'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
    QrCode as QrIcon, Download, Printer, Share2, Settings, Eye, 
    ArrowRight, ChevronLeft, Check, Smartphone, Plus,
    ShoppingBag, Wrench, CalendarDays, MessageCircle, 
    FileText, Share, Info, LayoutDashboard, Copy, 
    ExternalLink, CheckCircle2, MoreHorizontal, Gift, Star,
    Monitor, ChevronRight, X, UtensilsCrossed, ShoppingCart,
    Phone, Mail, Link2, GripVertical, User as UserIcon,
    ChevronDown, Minus, Layers
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches, useUpdateBranch } from '@/services/branches/hooks';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { buildBrandCssVars } from '@/lib/brandColor';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { PortalWelcome } from '@/components/visitor/PortalWelcome';
import { StepForm } from '@/components/visitor/StepForm';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useCatalogueItems, useCatalogueOffersAdmin } from '@/services/catalogue/hooks';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchDevices } from '@/lib/api/devices';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Tooltip from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

import { useQrThriveCodes } from '@/services/qr-thrive/hooks';
import { useRewards } from '@/services/loyalty/hooks';
import CustomerIdentificationModal from '@/components/dashboard/CustomerIdentificationModal';
import { useMarketingAssetValidation } from '@/hooks/useMarketingAssetValidation';

// --- Types ---
type FlowStep = 'hub' | 'deploy' | 'preview';

const ALL_SYSTEM_ACTIONS = [
    { id: 'system:order', title: 'Place Order', subtitle: 'Browse our Full Menu', icon: ShoppingBag },
    { id: 'system:offers', title: 'See Offers', subtitle: 'Exclusive Hot Deals', icon: Gift },
    { id: 'system:whatsapp', title: 'WhatsApp', subtitle: 'Instant Support', icon: MessageCircle },
    { id: 'system:forms', title: 'Fill Feedback', subtitle: 'Share your thoughts', icon: FileText },
    { id: 'system:engagement', title: 'Social Connect', subtitle: 'Follow us online', icon: Share2 },
];

const ACTION_CONFIG: Record<string, { path: string, label: string }> = {
    'system:order': { path: '/dashboard/catalogue', label: 'Catalogue' },
    'system:service': { path: '/dashboard/catalogue', label: 'Services' },
    'system:offers': { path: '/dashboard/catalogue', label: 'Offers' },
    'system:whatsapp': { path: '/dashboard/settings/profile?tab=general', label: 'Business Settings' },
    'system:forms': { path: '/dashboard/customer-capture', label: 'Forms' },
    'system:engagement': { path: '/dashboard/settings/profile?tab=socials', label: 'Social Settings' }
};

export default function CustomerExperienceRedesignPage() {
    const router = useRouter();
    const [step, setStep] = useState<FlowStep>('hub');
    const [previewTab, setPreviewTab] = useState<'ubl' | 'check-in' | 'outcome'>('ubl');
    const [isDesktop, setIsDesktop] = useState(false);
    const [emptyModal, setEmptyModal] = useState<{ show: boolean, id: string | null }>({ show: false, id: null });
    const [isIdModalOpen, setIsIdModalOpen] = useState(false);
    
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1280);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const user = useAuthStore((state) => state.user);
    const { activeBranchId } = useActiveBranch();
    const { data: business, isLoading: isBusinessLoading } = useMyBusiness(!!user);
    const { data: branches = [], isLoading: isBranchesLoading } = useBranches(!!user);
    const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];
    const updateBranchMutation = useUpdateBranch();

    const { 
        engagementSettings, 
        getBusinessConfig, 
        updateEngagementSettings,
        hasRewardSetup,
        customSuccessTitle,
        customSuccessMessage
    } = useCustomerFlowStore();

    // Sync engagement settings from active branch
    useEffect(() => {
        if (activeBranch?.engagement) {
            updateEngagementSettings(activeBranch.engagement);
        }
    }, [activeBranch?.id, updateEngagementSettings]);

    // Data for preview using established hooks
    const { data: allForms = [] } = useBusinessForms({ branchId: activeBranchId as string, enabled: !!user && !!activeBranchId });
    const { data: catalogueItems = [] } = useCatalogueItems({ branchId: activeBranchId as string }, { enabled: !!user && !!activeBranchId });
    const { data: catalogueOffers = [] } = useCatalogueOffersAdmin({ branchId: activeBranchId as string }, { enabled: !!user && !!activeBranchId });
    const { data: devices = [] } = useQuery({
        queryKey: ['devices', user?.businessId, activeBranchId, false],
        queryFn: () => fetchDevices(activeBranchId || undefined, false),
        enabled: !!user && !!activeBranchId
    });
    
    const { data: qrCodes = [] } = useQrThriveCodes(activeBranchId as string);
    const { data: rewards = [] } = useRewards(activeBranchId as string, !!user && !!activeBranchId);

    const brandColor = engagementSettings?.brandColor || activeBranch?.formAppearanceColor || business?.brandColor || '#066CF4';
    const brandVars = useMemo(() => buildBrandCssVars(brandColor), [brandColor]);
    const config = useMemo(() => getBusinessConfig(), [getBusinessConfig]);

    const [origin, setOrigin] = useState('https://vemtap.com');
    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);

    const publicUrl = activeBranch?.username
        ? `${origin}/${activeBranch.username}`
        : `${origin}/${activeBranch?.uniqueCode || 'your-business'}`;

    const mainDevice = devices.find((d: any) => d.isMain) || devices?.[0];
    const qrUrl = mainDevice
        ? `${origin}/tap/${mainDevice.code}`
        : `${origin}/s/${activeBranch?.uniqueCode || 'setup-pending'}`;

    const isInitialLoading = isBusinessLoading || isBranchesLoading;

    const hasSocials = useMemo(() => {
        const s = (engagementSettings || {}) as any;
        return !!(s.facebookUrl || s.instagramUrl || s.tiktokUrl || s.xUrl || s.linkedinUrl || s.youtubeUrl);
    }, [engagementSettings]);

    const contentStatus = useMemo(() => ({
        'system:order': catalogueItems.filter((i: any) => i.itemType === 'product').length > 0,
        'system:service': catalogueItems.filter((i: any) => i.itemType === 'service').length > 0,
        'system:offers': catalogueOffers.length > 0,
        'system:forms': allForms.length > 0,
        'system:whatsapp': !!activeBranch?.whatsappNumber,
        'system:engagement': hasSocials
    }), [catalogueItems, catalogueOffers, allForms, activeBranch?.whatsappNumber, hasSocials]);

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const ublSequence = engagementSettings?.ublSequence || ALL_SYSTEM_ACTIONS.map(a => a.id).slice(0, 5);

    const toggleSystemAction = (id: string, enabled: boolean) => {
        if (enabled && id.startsWith('system:') && !contentStatus[id as keyof typeof contentStatus]) {
            setEmptyModal({ show: true, id });
            return;
        }

        let newSequence = [...ublSequence];
        if (enabled && !newSequence.includes(id)) {
            newSequence.push(id);
        } else if (!enabled && newSequence.includes(id)) {
            newSequence = newSequence.filter(itemId => itemId !== id);
        }
        updateEngagementSettings({ ublSequence: newSequence });
        handleAutoSave({ ublSequence: newSequence });
    };

    const handleReorder = (newSequence: string[]) => {
        updateEngagementSettings({ ublSequence: newSequence });
        handleAutoSave({ ublSequence: newSequence });
    };

    const handleAutoSave = async (updates: any) => {
        if (!activeBranchId) return;
        try {
            await updateBranchMutation.mutateAsync({
                id: activeBranchId,
                updates: { engagement: { ...engagementSettings, ...updates } }
            });
        } catch {
            // Silently fail for auto-save
        }
    };

    const previewProps = {
        brandVars, brandColor, previewTab, setPreviewTab, businessName: business?.name || '', 
        logoUrl: activeBranch?.logoUrl || business?.logoUrl || '', 
        engagementSettings, catalogueItems, catalogueOffers, allForms, qrCodes, rewards, config, hasRewardSetup,
        customSuccessTitle, customSuccessMessage
    };

    const modalConfig = emptyModal.id ? ACTION_CONFIG[emptyModal.id] : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* NATIVE MOBILE HEADER — only shows on mobile */}
            {!isDesktop && (
                <section className="relative bg-[#066CF4] px-5 sm:px-8 pt-10 pb-20 rounded-b-[2.5rem] shadow-lg mb-6">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Smartphone size={120} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex flex-col">
                            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                                Digital Hub
                            </p>
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                Customer Experience
                            </h1>
                        </div>
                        <div className="pt-2 pb-4">
                            <p className="text-blue-100 text-xs font-semibold mb-1 flex items-center gap-1.5">
                                <Monitor size={14} /> Business
                            </p>
                            <h2 className="text-3xl font-black text-white tracking-tight truncate">
                                {business?.name || 'Your Experience'}
                            </h2>
                        </div>
                    </div>

                    {/* Step Segmented Control — Overlapping */}
                    <div className="absolute left-0 right-0 -bottom-6 px-5 sm:px-8">
                        <div className="bg-white p-1.5 rounded-2xl shadow-lg shadow-black/5 flex items-center">
                            {[
                                { key: 'hub' as FlowStep, label: 'Hub' },
                                { key: 'deploy' as FlowStep, label: 'Deploy' },
                                { key: 'preview' as FlowStep, label: 'Preview' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setStep(tab.key)}
                                    className={cn(
                                        "flex-1 h-11 rounded-xl text-xs font-black transition-all cursor-pointer",
                                        step === tab.key ? "bg-gray-900 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className={cn(
                "mx-auto transition-all duration-500 flex flex-col xl:flex-row xl:items-start xl:justify-center gap-12",
                isDesktop ? "max-w-7xl px-8" : "max-w-2xl px-0 pt-8"
            )}>
                <div className={cn("flex-1 w-full", isDesktop ? "max-w-3xl" : "w-full")}>
                    <AnimatePresence mode="wait">
                        {step === 'hub' && (
                            <ScreenHub 
                                key="hub"
                                businessName={business?.name || ''}
                                qrUrl={qrUrl}
                                publicUrl={publicUrl}
                                logoUrl={activeBranch?.logoUrl || business?.logoUrl || ''}
                                ublSequence={ublSequence}
                                qrCodes={qrCodes}
                                engagementSettings={engagementSettings}
                                contentStatus={contentStatus}
                                onToggle={toggleSystemAction}
                                onReorder={handleReorder}
                                onUpdateSettings={updateEngagementSettings}
                                onToDeploy={() => setStep('deploy')}
                                onPreview={() => setStep('preview')}
                                setIsIdModalOpen={setIsIdModalOpen}
                                isDesktop={isDesktop}
                            />
                        )}
                        {step === 'deploy' && (
                            <ScreenDeploy 
                                key="deploy"
                                businessName={business?.name || ''}
                                publicUrl={publicUrl}
                                onBack={() => setStep('hub')}
                                onToMarketing={() => router.push('/dashboard/marketing-assets')}
                            />
                        )}
                        {step === 'preview' && !isDesktop && (
                            <ScreenPreview 
                                key="preview"
                                onBack={() => setStep('hub')}
                                {...previewProps}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop Side Preview */}
                {isDesktop && (
                    <div className="sticky top-12 hidden xl:block shrink-0">
                        <ScreenPreviewSide {...previewProps} />
                    </div>
                )}
            </div>

            <CustomerIdentificationModal 
                isOpen={isIdModalOpen}
                onClose={() => setIsIdModalOpen(false)}
                onConfirm={() => {
                    updateEngagementSettings({ requireIdentify: false } as any);
                    handleAutoSave({ requireIdentify: false });
                    toast.success('Customer Identification disabled.');
                }}
            />

            {/* Beautiful Centered Content Modal */}
            <AnimatePresence>
                {emptyModal.show && modalConfig && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden border border-gray-100"
                        >
                            {/* Brand Decorative Element */}
                            <div className="absolute top-0 right-0 size-32 bg-[#066CF4]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="size-20 rounded-3xl bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center shadow-inner">
                                    <Info size={40} strokeWidth={2.5} />
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                                        Content Required
                                    </h3>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                        You cannot enable this feature until you have added content to the <span className="text-[#066CF4]">{modalConfig.label}</span> section.
                                    </p>
                                </div>

                                <div className="w-full flex flex-col gap-3 pt-4">
                                    <Button 
                                        onClick={() => {
                                            router.push(modalConfig.path);
                                            setEmptyModal({ show: false, id: null });
                                        }}
                                        className="h-16 w-full rounded-[1.5rem] bg-[#066CF4] hover:bg-[#0556c5] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#066CF4]/20 active:scale-95 transition-all"
                                    >
                                        Go to {modalConfig.label} <ArrowRight className="ml-2 size-4" strokeWidth={3} />
                                    </Button>
                                    <button 
                                        onClick={() => setEmptyModal({ show: false, id: null })}
                                        className="h-12 w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        Close and return
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function CollapsibleSection({ title, subtitle, children, isOpen, onToggle, icon: Icon }: any) {
    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm transition-all hover:border-[#066CF4]/20">
            <button 
                onClick={onToggle}
                className="w-full p-6 flex items-center justify-between group transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "size-10 rounded-2xl flex items-center justify-center transition-colors",
                        isOpen ? "bg-[#066CF4] text-white" : "bg-gray-50 text-gray-400 group-hover:text-[#066CF4]"
                    )}>
                        <Icon size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-base font-black text-gray-900 tracking-tight leading-none">{title}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 leading-none">
                            {subtitle}
                        </p>
                    </div>
                </div>
                <div className={cn("text-gray-300 transition-transform duration-300", isOpen && "rotate-180")}>
                    <ChevronDown size={20} />
                </div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-6 pb-6 pt-2 border-t border-gray-50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ScreenHub({ 
    businessName, qrUrl, publicUrl, logoUrl, 
    ublSequence, qrCodes = [], engagementSettings, contentStatus,
    onToggle, onReorder, onUpdateSettings,
    onToDeploy, onPreview, setIsIdModalOpen, isDesktop
}: any) {
    const [isCopying, setIsCopying] = useState(false);
    const [openSections, setOpenSections] = useState<string[]>([]);
    const [showMobileQR, setShowMobileQR] = useState(false);

    const toggleSection = (id: string) => {
        setOpenSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleIdToggle = (val: boolean) => {
        if (!val) {
            setIsIdModalOpen(true);
        } else {
            onUpdateSettings({ requireIdentify: true } as any);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
        toast.success('Link copied!');
    };

    const handlePrint = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const canvas = document.getElementById('business-qr-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        win.document.write(`
            <html>
                <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                    <h1 style="font-weight:900; margin-bottom:20px;">${businessName} QR</h1>
                    <img src="${dataUrl}" style="width:300px; height:300px;" />
                    <p style="margin-top:20px; font-weight:bold; color:#666;">Scan to access our digital experience</p>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        win.document.close();
    };

    const handleDownload = (format: 'png' | 'svg' | 'jpeg') => {
        const fileName = `${businessName.toLowerCase().replace(/\s+/g, '-')}-qr.${format}`;
        
        if (format === 'png' || format === 'jpeg') {
            const canvas = document.getElementById('business-qr-canvas') as HTMLCanvasElement;
            if (!canvas) return;
            const url = canvas.toDataURL(`image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
        } else {
            const svgEl = document.getElementById('business-qr-svg');
            if (!svgEl) return;
            const svgString = new XMLSerializer().serializeToString(svgEl);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
        }
        toast.success(`${format.toUpperCase()} downloaded!`);
    };

    const systemActions = useMemo(() => {
        const inSequence = ublSequence.filter((id: string) => id.startsWith('system:')).map((id: string) => ALL_SYSTEM_ACTIONS.find(a => a.id === id)).filter(Boolean);
        const others = ALL_SYSTEM_ACTIONS.filter(a => !ublSequence.includes(a.id));
        return [...inSequence, ...others];
    }, [ublSequence]);

    const qrThriveActions = useMemo(() => {
        const qrSequence = ublSequence.filter((id: string) => id.startsWith('qr-'));
        const inSequence = qrSequence.map((id: string) => {
            const shortId = id.replace('qr-', '');
            return qrCodes.find((q: any) => q.shortId === shortId);
        }).filter(Boolean);
        const others = qrCodes.filter((q: any) => !ublSequence.includes(`qr-${q.shortId}`));
        return [...inSequence, ...others];
    }, [ublSequence, qrCodes]);

    const handleToggleAll = (enabled: boolean) => {
        let newSequence = [...ublSequence];
        const systemIds = ALL_SYSTEM_ACTIONS.map(a => a.id);
        if (enabled) {
            systemIds.forEach((id: string) => {
                if (!newSequence.includes(id)) newSequence.push(id);
            });
        } else {
            newSequence = newSequence.filter((id: string) => !id.startsWith('system:'));
        }
        onUpdateSettings({ ublSequence: newSequence });
    };

    const handleToggleAllQR = (enabled: boolean) => {
        let newSequence = [...ublSequence];
        const qrIds = qrCodes.map((q: any) => `qr-${q.shortId}`);
        if (enabled) {
            qrIds.forEach((id: string) => {
                if (!newSequence.includes(id)) newSequence.push(id);
            });
        } else {
            newSequence = newSequence.filter((id: string) => !id.startsWith('qr-'));
        }
        onUpdateSettings({ ublSequence: newSequence });
    };

    const handleActionReorder = (newItems: any[], prefix: string) => {
        const otherItems = ublSequence.filter((id: string) => !id.startsWith(prefix));
        const newSequence = [...newItems.map(item => item.id.startsWith('system:') || item.id.startsWith('qr-') ? item.id : `${prefix}${item.shortId || item.id}`), ...otherItems];
        onReorder(newSequence);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-10 px-6 pt-12"
        >
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                    <div className={cn(
                        "size-48 md:size-64 bg-white border-[12px] border-gray-100 rounded-[3rem] p-6 flex items-center justify-center shadow-inner relative group transition-all duration-500",
                        !isDesktop && !showMobileQR ? "hidden" : "flex"
                    )}>
                        <QRCodeCanvas 
                            id="business-qr-canvas"
                            value={publicUrl} 
                            size={200} 
                            level="H"
                            includeMargin={false}
                            imageSettings={logoUrl ? {
                                src: logoUrl,
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            } : undefined}
                        />
                        <div id="business-qr-svg" className="hidden">
                            <QRCodeSVG 
                                value={publicUrl} 
                                size={1000} 
                                level="H"
                                imageSettings={logoUrl ? {
                                    src: logoUrl,
                                    x: undefined,
                                    y: undefined,
                                    height: 200,
                                    width: 200,
                                    excavate: true,
                                } : undefined}
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-gray-900 leading-tight">My Business QR</h2>
                            <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto md:mx-0 leading-relaxed">
                                Your Business QR is automatically created during setup. Customers scan this QR to access your business experience.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="h-12 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-black/5 px-6">
                                        <Download className="mr-2 size-4" /> Download QR
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleDownload('png')}>PNG Image</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload('jpeg')}>JPEG Image</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload('svg')}>SVG Vector</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={handlePrint} variant="outline" className="hidden md:flex h-12 border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-50">
                                <Printer className="mr-2 size-4" /> Print
                            </Button>

                            <Button onClick={handleCopy} variant="outline" className="h-12 border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-50">
                                {isCopying ? <Check className="mr-2 size-4 text-emerald-500" /> : <Share2 className="mr-2 size-4" />}
                                {isCopying ? 'Link Copied' : 'Share Link'}
                            </Button>
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            {!isDesktop && (
                                <Button 
                                    onClick={() => setShowMobileQR(!showMobileQR)}
                                    variant="outline"
                                    className="w-full h-14 border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50"
                                >
                                    {showMobileQR ? 'Hide My QR' : 'View My QR'}
                                </Button>
                            )}
                            <Button 
                                onClick={onToDeploy}
                                className="w-full md:w-auto h-14 bg-[#066CF4] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/20 px-10 hover:bg-[#0556c5] transition-all"
                            >
                                Get Marketing Kit <ArrowRight className="ml-3 size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-[#066CF4]/10 flex items-center justify-center text-[#066CF4]">
                            <Layers size={18} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Manage Experience Sequence</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[9px] font-black uppercase tracking-widest text-[#066CF4] hover:bg-[#066CF4]/5"
                            onClick={() => handleToggleAll(true)}
                        >
                            Enable All
                        </Button>
                        <div className="w-px h-3 bg-gray-200" />
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50"
                            onClick={() => handleToggleAll(false)}
                        >
                            Disable All
                        </Button>
                    </div>
                </div>

                <CollapsibleSection 
                    title="Default Form" 
                    subtitle="Capture name, phone and email"
                    icon={UserIcon}
                    isOpen={openSections.includes('form')}
                    onToggle={() => toggleSection('form')}
                >
                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "size-10 rounded-2xl flex items-center justify-center shrink-0",
                                    engagementSettings?.requireIdentify !== false ? "bg-[#066CF4] text-white" : "bg-gray-100 text-gray-400"
                                )}>
                                    <UserIcon size={20} />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-gray-900 leading-tight">Customer Identification</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Active for every new customer</p>
                                </div>
                            </div>
                            <Switch 
                                checked={engagementSettings?.requireIdentify !== false}
                                onCheckedChange={handleIdToggle}
                                className="data-[state=checked]:bg-[#066CF4]"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100/50">
                            {[
                                { label: 'Full Name', placeholder: 'e.g. John Doe' },
                                { label: 'Phone Number', placeholder: 'e.g. +1 234 567 890' },
                                { label: 'Email Address', placeholder: 'e.g. john@example.com' }
                            ].map((field) => (
                                <div key={field.label} className="relative group/field opacity-60">
                                    <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                                        <div className="size-1 rounded-full bg-gray-300" />
                                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-300">Locked</span>
                                    </div>
                                    <div className="h-10 w-full rounded-2xl bg-white border border-gray-100 px-4 flex flex-col justify-center">
                                        <span className="text-[7px] font-black uppercase tracking-[0.1em] text-gray-400 leading-none">{field.label}</span>
                                        <span className="text-[10px] font-bold text-gray-400 mt-0.5 leading-none">{field.placeholder}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection 
                    title="What Customer Sees" 
                    subtitle="Toggle and sequence actions"
                    icon={Eye}
                    isOpen={openSections.includes('sees')}
                    onToggle={() => toggleSection('sees')}
                >
                    <div className="space-y-4">
                        <Reorder.Group 
                            axis="y" 
                            values={systemActions} 
                            onReorder={(newItems) => handleActionReorder(newItems, 'system:')}
                            className="space-y-2.5"
                        >
                            {systemActions.map((action: any) => {
                                const isEnabled = ublSequence.includes(action.id);
                                const isEmpty = !contentStatus[action.id];
                                
                                return (
                                    <Reorder.Item 
                                        key={action.id} 
                                        value={action}
                                        dragListener={isEnabled}
                                        className={cn(
                                            "bg-gray-50/50 px-5 py-4 rounded-3xl border transition-all flex flex-col gap-4 group",
                                            isEnabled 
                                                ? "border-gray-100 shadow-sm bg-white" 
                                                : "border-gray-50 opacity-60 grayscale-[0.5]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                {isEnabled && (
                                                    <div className="text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0">
                                                        <GripVertical size={18} />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "size-9 rounded-xl flex items-center justify-center shrink-0",
                                                    isEnabled ? "bg-[#066CF4] text-white" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    <action.icon size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-sm font-black text-gray-900 leading-tight">{action.title}</h4>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{action.subtitle}</p>
                                                </div>
                                            </div>
                                            <Switch 
                                                checked={isEnabled}
                                                onCheckedChange={(val) => onToggle(action.id, val)}
                                                className="data-[state=checked]:bg-[#066CF4]"
                                            />
                                        </div>

                                        {isEnabled && isEmpty && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100 flex items-center gap-3"
                                            >
                                                <div className="size-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                    <Info size={12} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[9px] font-black text-orange-800 uppercase tracking-tight leading-none">Requires Content</p>
                                                    <p className="text-[8px] font-bold text-orange-600/80 uppercase tracking-tighter leading-none mt-1">
                                                        This page is empty. Add content to show it.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection 
                    title="QRThrive QRs" 
                    subtitle="External experience links"
                    icon={QrIcon}
                    isOpen={openSections.includes('qr')}
                    onToggle={() => toggleSection('qr')}
                >
                    <div className="space-y-4">
                        {qrCodes.length > 0 && (
                            <div className="flex gap-4 justify-end px-2">
                                <button 
                                    onClick={() => handleToggleAllQR(true)}
                                    className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:opacity-80 transition-opacity"
                                >
                                    Enable All
                                </button>
                                <button 
                                    onClick={() => handleToggleAllQR(false)}
                                    className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:opacity-80 transition-opacity"
                                >
                                    Disable All
                                </button>
                            </div>
                        )}
                        {qrCodes.length === 0 ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No QRThrive codes found</p>
                            </div>
                        ) : (
                            <Reorder.Group 
                                axis="y" 
                                values={qrThriveActions} 
                                onReorder={(newItems) => handleActionReorder(newItems, 'qr-')}
                                className="space-y-2.5"
                            >
                                {qrThriveActions.map((qr: any) => {
                                    const actionId = `qr-${qr.shortId}`;
                                    const isEnabled = ublSequence.includes(actionId);
                                    return (
                                        <Reorder.Item 
                                            key={qr.id} 
                                            value={qr}
                                            dragListener={isEnabled}
                                            className={cn(
                                                "bg-gray-50/50 px-5 py-4 rounded-3xl border transition-all flex items-center justify-between group",
                                                isEnabled 
                                                    ? "border-gray-100 shadow-sm bg-white" 
                                                    : "border-gray-50 opacity-60 grayscale-[0.5]"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                {isEnabled && (
                                                    <div className="text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0">
                                                        <GripVertical size={18} />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "size-9 rounded-xl flex items-center justify-center shrink-0",
                                                    isEnabled ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    <QrIcon size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-sm font-black text-gray-900 leading-tight">{qr.name}</h4>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{qr.type} experience</p>
                                                </div>
                                            </div>
                                            <Switch 
                                                checked={isEnabled}
                                                onCheckedChange={(val) => onToggle(actionId, val)}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </Reorder.Item>
                                    );
                                })}
                            </Reorder.Group>
                        )}
                    </div>
                </CollapsibleSection>
            </div>
        </motion.div>
    );
}

// --- SCREEN 3: DEPLOY ---
function ScreenDeploy({ businessName, publicUrl, onBack, onToMarketing }: any) {
    const { isValid, errors } = useMarketingAssetValidation();
    const router = useRouter();

    const handleDownload = (format: 'png' | 'svg' | 'jpeg' | 'pdf') => {
        const fileName = `${businessName.toLowerCase().replace(/\s+/g, '-')}-qr.${format}`;
        
        if (format === 'pdf') {
            const canvas = document.getElementById('deploy-qr-canvas') as HTMLCanvasElement;
            if (!canvas) return;
            const dataUrl = canvas.toDataURL('image/png');
            const win = window.open('', '_blank');
            if (!win) return;
            win.document.write(`
                <html>
                    <body style="margin:0; display:flex; align-items:center; justify-content:center; height:100vh;">
                        <img src="${dataUrl}" style="width:80%; max-width:500px;" />
                        <script>window.onload = () => { window.print(); window.close(); }</script>
                    </body>
                </html>
            `);
            win.document.close();
            return;
        }

        if (format === 'png' || format === 'jpeg') {
            const canvas = document.getElementById('deploy-qr-canvas') as HTMLCanvasElement;
            if (!canvas) return;
            const url = canvas.toDataURL(`image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
        } else {
            const svgEl = document.getElementById('deploy-qr-svg');
            if (!svgEl) return;
            const svgString = new XMLSerializer().serializeToString(svgEl);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
        }
        toast.success(`${format.toUpperCase()} downloaded!`);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full px-6 pt-12 space-y-12 relative"
        >
            <div className="sticky top-24 z-50 w-full max-w-lg mx-auto h-0 overflow-visible pointer-events-none">
                <button 
                    onClick={onBack} 
                    className="absolute top-0 left-0 pointer-events-auto size-12 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-100 flex items-center justify-center text-gray-900 hover:bg-white hover:border-gray-200 shadow-lg transition-all active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            <div className="text-center space-y-6 max-w-lg mx-auto">
                <div id="deploy-qr-svg" className="hidden">
                    <QRCodeSVG value={publicUrl} size={1000} level="H" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">How would you like to use your Business QR?</h2>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed">
                        Choose how you want to deploy your primary QR code to customers.
                    </p>
                </div>
            </div>

            <div className="max-w-xl mx-auto pb-20">
                <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-8 group hover:border-[#066CF4]/20 transition-all relative">
                    {!isValid && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[3rem] z-10 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="size-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                                <Wrench size={24} />
                            </div>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{errors[0]?.message}</p>
                            <Button 
                                onClick={() => router.push(errors[0]?.actionPath)}
                                className="h-10 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl"
                            >
                                {errors[0]?.actionLabel}
                            </Button>
                        </div>
                    )}
                    
                    <div className="size-24 bg-[#066CF4]/10 text-[#066CF4] rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Monitor size={48} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-gray-900 leading-none">Use Marketing Kit</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed px-4">
                            Use ready-made printable materials that already include your Business QR.
                        </p>
                    </div>
                    <Button 
                        disabled={!isValid}
                        onClick={onToMarketing}
                        className="w-full h-16 bg-gray-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl group-hover:bg-[#066CF4] transition-all shadow-xl shadow-black/5 mt-auto"
                    >
                        Continue To Assets <ChevronRight size={18} className="ml-2" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

function ScreenPreview({ 
    onBack, brandVars, brandColor, previewTab, setPreviewTab, businessName, logoUrl, 
    engagementSettings, catalogueItems, catalogueOffers, allForms, qrCodes, rewards, config, hasRewardSetup,
    customSuccessTitle, customSuccessMessage
}: any) {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gray-900 p-6 flex flex-col items-center gap-12 fixed inset-0 z-[100]"
        >
            <div className="w-full max-w-xl flex items-center justify-between">
                <button onClick={onBack} className="size-12 rounded-2xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <h2 className="text-white text-lg font-black tracking-tight">Customer View</h2>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Live Interactive Preview</p>
                </div>
                <div className="size-12" />
            </div>

            <div style={brandVars} className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full scale-150 -z-10 group-hover:bg-blue-500/30 transition-all" />
                <PhoneFrame>
                    <PreviewFrameContents 
                        previewTab={previewTab}
                        businessName={businessName}
                        logoUrl={logoUrl}
                        engagementSettings={engagementSettings}
                        setPreviewTab={setPreviewTab}
                        config={config}
                        hasRewardSetup={hasRewardSetup}
                        catalogueItems={catalogueItems}
                        catalogueOffers={catalogueOffers}
                        allForms={allForms}
                        qrCodes={qrCodes}
                        rewards={rewards}
                        brandColor={brandColor}
                        customSuccessTitle={customSuccessTitle}
                        customSuccessMessage={customSuccessMessage}
                    />
                </PhoneFrame>
            </div>

        </motion.div>
    );
}

function ScreenPreviewSide({ 
    brandVars, brandColor, previewTab, setPreviewTab, businessName, logoUrl, 
    engagementSettings, catalogueItems, catalogueOffers, allForms, qrCodes, rewards, config, hasRewardSetup,
    customSuccessTitle, customSuccessMessage
}: any) {
    return (
        <div className="flex flex-col items-center gap-8">
            <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Customer View</p>
            </div>
            
            <div style={brandVars} className="relative scale-90 origin-top">
                <div className="absolute inset-0 bg-[#066CF4]/10 blur-[100px] rounded-full scale-150 -z-10" />
                <PhoneFrame>
                    <PreviewFrameContents 
                        previewTab={previewTab}
                        businessName={businessName}
                        logoUrl={logoUrl}
                        engagementSettings={engagementSettings}
                        setPreviewTab={setPreviewTab}
                        config={config}
                        hasRewardSetup={hasRewardSetup}
                        catalogueItems={catalogueItems}
                        catalogueOffers={catalogueOffers}
                        allForms={allForms}
                        qrCodes={qrCodes}
                        rewards={rewards}
                        brandColor={brandColor}
                        customSuccessTitle={customSuccessTitle}
                        customSuccessMessage={customSuccessMessage}
                    />
                </PhoneFrame>
            </div>

        </div>
    );
}

function PreviewFrameContents({ 
    previewTab, businessName, logoUrl, engagementSettings, setPreviewTab, config, 
    hasRewardSetup, catalogueItems, catalogueOffers, allForms, qrCodes, rewards, 
    brandColor, customSuccessTitle, customSuccessMessage 
}: any) {
    const displayName = businessName || "VemTap";
    const displayLogo = logoUrl || "/VEMTAP_PNG.png";

    return (
        <div className="h-full bg-white overflow-y-auto no-scrollbar flex flex-col">
            <div className="flex-1">
                {previewTab === 'check-in' && (
                    <StepForm
                        storeName={businessName}
                        logoUrl={logoUrl}
                        customWelcomeMessage={(engagementSettings as any)?.customWelcomeMessage || undefined}
                        customWelcomeTitle={(engagementSettings as any)?.customWelcomeTitle || undefined}
                        customWelcomeTag={(engagementSettings as any)?.customWelcomeTag || undefined}
                        customPrivacyMessage={(engagementSettings as any)?.customPrivacyMessage || undefined}
                        submitLabel={(engagementSettings as any)?.submitLabel || undefined}
                        isPreview={true}
                        onBack={() => setPreviewTab('ubl')}
                        onSubmit={() => setPreviewTab('outcome')}
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
                        branchName={businessName}
                        logoUrl={logoUrl}
                        welcomeTitle={engagementSettings?.customWelcomeTitle || undefined}
                        welcomeMessage={engagementSettings?.customWelcomeMessage || undefined}
                        onAction={() => {}}
                        productCount={catalogueItems.filter((i: any) => i.itemType === 'product').length}
                        serviceCount={catalogueItems.filter((i: any) => i.itemType === 'service').length}
                        offerCount={catalogueOffers.length}
                        formCount={allForms.length}
                        engagement={engagementSettings}
                        whatsappNumber="1234567890"
                        qrThriveCodes={qrCodes}
                        availableForms={allForms}
                        availableRewards={rewards}
                        ublSequence={engagementSettings?.ublSequence}
                        brandColor={brandColor}
                        isPreview={true}
                    />
                )}
            </div>

            <footer className="py-6 flex flex-col items-center gap-4 bg-gray-50/50 mt-auto border-t border-gray-100">
                <div className="flex items-center gap-2 opacity-10 grayscale saturate-0 pointer-events-none">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-900">Transaction Verified</span>
                </div>
                
                <div className="flex items-center gap-2 opacity-40">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        <img src={displayLogo} alt={displayName} className="w-3 h-3 object-contain opacity-50" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Powered by {displayName}</span>
                </div>
            </footer>
        </div>
    );
}
