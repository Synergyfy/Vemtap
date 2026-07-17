'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, QrCode, Users as UsersIcon, BarChart3, Globe, ChevronRight, 
    ChevronLeft, ExternalLink, Plus, List, Loader2, RefreshCw,
    Palette, Frame, Image as ImageIcon, CheckCircle2, Phone,
    FileText, Image, Video, User, SmartphoneNfc, Music, 
    Building2, UtensilsCrossed, Link2, Ticket, Wifi,
    Mail, X, ArrowRight, ArrowLeft, HelpCircle, Trash2, Copy, Download, Lock, Edit2,
    WifiOff, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import { updateDevice } from '@/lib/api/devices';


// Components
import { QrTypeSelector } from './components/QrTypeSelector';
import { QrGrid } from './components/QrGrid';
import { QrPreview } from './components/QrPreview';
import { DesignPanel } from './components/DesignPanel';
import { ContentForm } from './components/ContentForm';

// QRThrive Hub Components
import { 
    QRThriveOverviewHeader,
    QRThriveMetrics,
    QRThriveQuickActions,
    QRThriveCategoriesGrid,
    QRThriveLeaderboard
} from '@/components/dashboard/qr-thrive/QRThriveHub';
import { QRThriveManagementView } from '@/components/dashboard/qr-thrive/QRThriveManagement';
import { QRThriveAnalyticsView } from '@/components/dashboard/qr-thrive/QRThriveAnalytics';

// QRThrive Dynamic Preview
import DynamicView from '@/components/qr-thrive/DynamicView';

// Hooks & Services
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { 
    useQrThriveCodes, 
    useCreateQrThriveCode, 
    useQrThriveStats,
    useQrThriveProvisioningStatus,
    useProvisionQrThriveUser,
    useDeleteQrThriveCode,
    useUpdateQrThriveCode,
    useDuplicateQrThriveCode,
    useSetQrThriveCodeStatus,
    useResetQrThriveMapping,
    useSubscriptionIncludesQrThrive,
    useMainQrCode,
    useRecreateMainQrCode,
    useUpdateMainQrCode,
    useSetQRCodeAsMain,
} from '@/services/qr-thrive/hooks';
import { useActionPermission } from '@/hooks/useActionPermission';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { QRType, DEFAULT_QR_DESIGN, DEFAULT_QR_FRAME } from '@/services/qr-thrive/types';
import StatsCard from '@/components/dashboard/StatsCard';


const STEPS = [
    { id: 'type', label: 'Choose Type' },
    { id: 'content', label: 'Add Content' },
    { id: 'design', label: 'Design QR' },
];

const getScanCount = (scans: any): number => {
    if (!scans) return 0;
    if (Array.isArray(scans)) return scans.length;
    if (typeof scans === 'number') return scans;
    if (typeof scans === 'string') {
        const num = parseInt(scans, 10);
        return isNaN(num) ? 0 : num;
    }
    if (typeof scans === 'object') {
        if ('id' in scans || 'qrCodeId' in scans) return 1;
        return 0;
    }
    return 0;
};

export default function ExploreQRThrivePage() {
    const { canPerformAction } = useActionPermission();
    
    // Bridge internal state with store
    const { view: storeView, setView: setStoreView, setSelectedType: setStoreSelectedType } = useQrThriveStore();
    const [view, setView] = useState<'hub' | 'list' | 'create' | 'edit' | 'analytics'>(
        storeView === 'manage' ? 'list' : storeView as any
    );
    
    const [step, setStep] = useState<'type' | 'content' | 'design'>('type');
    const [designTab, setDesignTab] = useState<'shape' | 'frame' | 'logo'>('shape');
    const [previewMode, setPreviewMode] = useState<'preview' | 'qr'>('qr');
    
    const [selectedType, setSelectedType] = useState<QRType | null>(null);
    const [hoveredType, setHoveredType] = useState<QRType | null>(null);
    const [qrData, setQrData] = useState<any>({ type: 'url', url: 'https://qrthrive.com' });
    const [qrDesign, setQrDesign] = useState(DEFAULT_QR_DESIGN);
    const [qrFrame, setQrFrame] = useState(DEFAULT_QR_FRAME);
    const [qrLogo, setQrLogo] = useState<string | undefined>();
    const [qrName, setQrName] = useState('');
    const [sourceDeviceId, setSourceDeviceId] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const qrRefs = useRef<Record<string, any>>({});

    // Sync internal view with store when store changes
    useEffect(() => {
        if (storeView === 'hub') setView('hub');
        if (storeView === 'manage') setView('list');
        if (storeView === 'create') setView('create');
        if (storeView === 'analytics') setView('analytics');
    }, [storeView]);

    // Handle view changes internally
    const handleSetView = (newView: any) => {
        setView(newView);
        setStoreView(newView === 'list' ? 'manage' : newView);
    };

    const { isProvisioned, isProvisioning, provisionError, setProvisioned, setProvisioning, setProvisionError } = useQrThriveStore();
    const provisionMutation = useProvisionQrThriveUser();
    const { data: subscriptionData, isPending: isCheckingSubscription } = useSubscriptionIncludesQrThrive();
    
    const { activeBranchId } = useActiveBranch();
    const { data: branches = [] } = useBranches();
    const [origin, setOrigin] = useState('https://vemtap.com');
    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);
    const currentBranch = branches.find((b: any) => b.id === activeBranchId);
    const branchUsername = currentBranch?.username || null;
    const searchParams = useSearchParams();
    const router = useRouter();
    const prefillUrl = searchParams.get('prefill_url');
    const prefillName = searchParams.get('prefill_name');
    const prefillDeviceId = searchParams.get('device_id');

    useEffect(() => {
        if (prefillUrl) {
            handleSetView('create');
            setSelectedType('url' as QRType);
            setQrData({ type: 'url', url: decodeURIComponent(prefillUrl) });
            if (prefillName) setQrName(decodeURIComponent(prefillName));
            if (prefillDeviceId) {
                setSourceDeviceId(prefillDeviceId);
                setIsLocked(true);
            }
            setStep('content');
            // Clean up URL to avoid re-triggering on refresh
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('prefill_url');
            newParams.delete('prefill_name');
            newParams.delete('device_id');
            const cleanPath = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
            router.replace(cleanPath);
        }
    }, [prefillUrl, prefillName, prefillDeviceId, router, searchParams]);

    const deleteMutation = useDeleteQrThriveCode();
    const duplicateMutation = useDuplicateQrThriveCode();
    const statusMutation = useSetQrThriveCodeStatus();

    const createMutation = useCreateQrThriveCode();
    const updateMutation = useUpdateQrThriveCode();
    const updateMainQrMutation = useUpdateMainQrCode();
    const setAsMainMutation = useSetQRCodeAsMain();
    const resetMappingMutation = useResetQrThriveMapping();

    const {
        data: codes,
        isLoading: isLoadingCodes,
        error: codesError,
        refetch: refetchCodes
    } = useQrThriveCodes();

    const {
        data: stats,
        error: statsError,
        refetch: refetchStats,
    } = useQrThriveStats();

    const {
        data: mainQrData,
        isLoading: isLoadingMainQr,
        error: mainQrError,
    } = useMainQrCode(activeBranchId && activeBranchId !== 'all' ? activeBranchId : null);

    const mainQrCodeId = mainQrData?.qrCode?.id || null;
    const mainQrCode = mainQrData?.qrCode || null;
    const branchUniqueCode = currentBranch?.uniqueCode || null;

    const recreateMainMutation = useRecreateMainQrCode();

    const isSaving = createMutation.isPending || updateMutation.isPending || isUploadingFiles;
    const isError404 = (codesError as any)?.status === 404 ||
        (statsError as any)?.status === 404 ||
        (codesError as any)?.message?.includes('404') ||
        (statsError as any)?.message?.includes('404');

    const isQrThriveDown = !isError404 && (
        // Network errors (service unreachable)
        (codesError instanceof TypeError && codesError.message === 'fetch is not defined') ||
        (codesError as any)?.message === 'Failed to fetch' ||
        (codesError as any)?.message?.includes('NetworkError') ||
        (codesError as any)?.message?.includes('network') ||
        (statsError as any)?.message === 'Failed to fetch' ||
        (statsError as any)?.message?.includes('NetworkError') ||
        (mainQrError as any)?.message === 'Failed to fetch' ||
        // 5xx server errors
        (codesError as any)?.status >= 500 ||
        (statsError as any)?.status >= 500 ||
        (mainQrError as any)?.status >= 500 ||
        // Connection refused / timeouts
        (codesError as any)?.message?.includes('timeout') ||
        (statsError as any)?.message?.includes('timeout')
    );

    // Show loading state until subscription check is resolved
    if (isCheckingSubscription) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="size-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    const isSubscriptionLocked = subscriptionData &&
        !subscriptionData.includesQrThrive &&
        subscriptionData.subscriptionStatus !== 'active' &&
        subscriptionData.subscriptionStatus !== 'trial';

    if (isSubscriptionLocked) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 flex flex-col items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="size-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-primary mx-auto mb-6 border border-gray-100">
                        <Lock size={40} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-text-main mb-3">QR-Thrive Not Included</h2>
                    <p className="text-text-secondary font-medium mb-4">
                        Your current subscription does not include QR-Thrive.
                        Upgrade your plan to unlock QR code generation and management.
                    </p>
                    {subscriptionData.subscriptionStatus === 'expired' && (
                        <p className="text-orange-600 font-medium mb-6">
                            Your subscription has expired. Please renew to continue using QR-Thrive.
                        </p>
                    )}
                    <button
                        onClick={() => router.push('/dashboard/settings/subscription')}
                        className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                    >
                        View Subscription Plans
                    </button>
                </div>
            </div>
        );
    }

    const handleEditMainQr = () => {
        if (!mainQrCode) return;
        setSelectedQrId(mainQrCode.id);
        setSelectedType((mainQrCode.type || 'url') as QRType);
        setQrData(mainQrCode.data || { type: 'url', url: 'https://qrthrive.com' });
        setQrName(mainQrCode.name || '');
        setQrDesign(mainQrCode.design || DEFAULT_QR_DESIGN);
        setQrFrame(mainQrCode.frame || DEFAULT_QR_FRAME);
        setQrLogo(mainQrCode.logo);
        handleSetView('edit');
        setStep('type');
        setIsLocked(false);
    };

    const handleEditCode = (qr: any) => {
        if (!qr) return;
        setSelectedQrId(qr.id);
        setSelectedType((qr.type || 'url') as QRType);
        setQrData(qr.data || { type: 'url', url: 'https://qrthrive.com' });
        setQrName(qr.name || '');
        setQrDesign(qr.design || DEFAULT_QR_DESIGN);
        setQrFrame(qr.frame || DEFAULT_QR_FRAME);
        setQrLogo(qr.logo);
        handleSetView('edit');
        setStep('type');
        setIsLocked(false);
    };

    const handleCreateNew = () => {
        handleSetView('create');
        setStep('type');
        setSelectedType(null);
        setQrData({ type: 'url', url: 'https://qrthrive.com' });
        setQrName('');
        setQrDesign(DEFAULT_QR_DESIGN);
        setQrFrame(DEFAULT_QR_FRAME);
        setQrLogo(undefined);
        setSelectedQrId(null);
        setIsLocked(false);
    };

    const handleTypeSelect = (type: QRType) => {
        setSelectedType(type);
        setQrData({ type, url: 'https://qrthrive.com' });
        setStep('content');
    };

    const handleBack = () => {
        if (step === 'content') {
            if (isLocked) {
                handleSetView('list');
                return;
            }
            setStep('type');
        }
        else if (step === 'design') setStep('content');
    };

    const handleNext = () => {
        if (step === 'type' && selectedType) setStep('content');
        else if (step === 'content') setStep('design');
    };

    const handleFinish = async () => {
        if (!qrName.trim()) {
            setQrName(`${selectedType} QR`);
        }
        try {
            const config = {
                design: qrDesign,
                frame: qrFrame,
                logo: qrLogo,
            };
            
            // Show loading toast if files are being uploaded
            const loadingToast = toast.loading('Processing and uploading files...');
            setIsUploadingFiles(true);
            
            // This strips out raw File objects (in pendingFiles) which can't be JSON serialized,
            // leaving behind only the base64 strings (e.g. data:image/png;base64,...)
            let uploadedQrData = JSON.parse(JSON.stringify(qrData));
            let finalQrLogo = qrLogo;
            
            try {
                const { uploadToCloudinary } = await import('@/lib/cloudinary');
                
                // 1. Upload the QR Logo if it's base64
                if (finalQrLogo && finalQrLogo.startsWith('data:')) {
                    finalQrLogo = await uploadToCloudinary(finalQrLogo);
                }

                // 2. Recursively upload all base64 media inside qrData
                const uploadBase64Strings = async (obj: any) => {
                    if (!obj || typeof obj !== 'object') return;
                    for (const key of Object.keys(obj)) {
                        const val = obj[key];
                        if (typeof val === 'string' && val.startsWith('data:')) {
                            obj[key] = await uploadToCloudinary(val);
                        } else if (typeof val === 'object' && val !== null) {
                            await uploadBase64Strings(val);
                        }
                    }
                };
                
                await uploadBase64Strings(uploadedQrData);

            } catch (uploadErr) {
                console.error("Upload error:", uploadErr);
                toast.dismiss(loadingToast);
                toast.error('Failed to upload media files to Cloudinary.');
                setIsUploadingFiles(false);
                return;
            }
            
            toast.dismiss(loadingToast);

            const payload = {
                name: qrName || `${selectedType} QR`,
                type: selectedType!,
                data: uploadedQrData,
                design: qrDesign,
                frame: qrFrame,
                logo: finalQrLogo,
                isDynamic: true
            };

            if (view === 'edit' && selectedQrId) {
                // Strip fields that are not allowed in UpdateQRCodeDto
                const { isDynamic, ...updatePayload } = payload;

                if (mainQrCodeId && selectedQrId === mainQrCodeId) {
                    await updateMainQrMutation.mutateAsync({
                        qrId: selectedQrId,
                        data: updatePayload as any,
                        branchId: activeBranchId || undefined
                    });
                    toast.success('Main QR Code updated — it is now a regular QR code.');
                } else {
                    await updateMutation.mutateAsync({
                        qrId: selectedQrId,
                        data: updatePayload as any,
                        branchId: activeBranchId || undefined
                    });
                    toast.success('QR Code updated successfully!');
                }
            } else {
                const newQr = await createMutation.mutateAsync({
                    data: payload,
                    branchId: activeBranchId || undefined
                });

                // If we came from a device, update the device with this design config
                if (sourceDeviceId) {
                    try {
                        await updateDevice(sourceDeviceId, {
                            // Assuming the backend can store design settings
                            // We store the design metadata so the Business Link page can render it
                            config: {
                                ...config,
                                qrThriveId: newQr.id
                            }
                        } as any);
                    } catch (deviceErr) {
                        console.error('Failed to update source device:', deviceErr);
                    }
                }
                toast.success('QR Code created successfully!');
            }
            handleSetView('list');
            refetchCodes();
        } catch (error: any) {
            toast.error(error?.message || `Failed to ${view === 'edit' ? 'update' : 'create'} QR Code`);
        } finally {
            setIsUploadingFiles(false);
        }
    };

    const handleProvision = async () => {
        try {
            await provisionMutation.mutateAsync();
            setProvisioned(true);
            toast.success('QRThrive account activated!');
        } catch (error: any) {
            setProvisionError(error?.message || 'Failed to activate QRThrive');
            toast.error(error?.message || 'Failed to activate QRThrive');
        }
    };

    if (provisionMutation.isPending) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px]">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Setting up your QRThrive account...</h2>
                <p className="text-gray-500">This only takes a few seconds.</p>
            </div>
        );
    }

    if (provisionError || isError404) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 lg:p-12 text-center bg-slate-50">
                <div className="max-w-xl w-full bg-white rounded-[3rem] p-10 lg:p-14 border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 bg-red-600/10 blur-[30px] rounded-full animate-pulse" />
                        <Zap className="w-12 h-12 relative z-10 fill-red-600" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Integration Sync Issue</h2>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        {isError404 
                            ? "Your QR-Thrive account mapping seems to be out of sync. This can happen after system updates or if account data was moved. A quick repair will restore your access." 
                            : provisionError || "We encountered an error while connecting to QR-Thrive."}
                    </p>

                    <div className="space-y-4">
                        {isError404 && !canPerformAction('delete') ? (
                             <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-xs font-bold text-center">
                                Repairing integration is restricted during impersonation for agents.
                             </div>
                        ) : (
                            <button 
                                onClick={isError404 ? () => resetMappingMutation.mutate() : handleProvision}
                                disabled={resetMappingMutation.isPending || provisionMutation.isPending}
                                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {(resetMappingMutation.isPending || provisionMutation.isPending) ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {isError404 ? 'Repair Integration' : 'Try Again'}
                                        <RefreshCw className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}

                        <button 
                            onClick={() => {
                                refetchCodes();
                                toast.success('Checking status...');
                            }}
                            className="w-full py-5 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-100 transition-all border border-slate-100 active:scale-95"
                        >
                            I fixed it manually, refresh now
                        </button>
                    </div>

                    <div className="mt-12 pt-10 border-t border-slate-50 flex flex-col items-center gap-4">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Still having issues?</p>
                        <div className="flex items-center gap-6">
                            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">Contact Support</button>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <button className="text-xs font-bold text-slate-500 hover:text-slate-600" onClick={() => window.location.reload()}>Reload Page</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isQrThriveDown) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 lg:p-12 text-center bg-slate-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="max-w-xl w-full bg-white rounded-[3rem] p-10 lg:p-14 border border-slate-100 shadow-2xl shadow-slate-200/50"
                >
                    <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 bg-amber-500/15 blur-[40px] rounded-full" />
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <WifiOff className="w-12 h-12 relative z-10" />
                        </motion.div>
                    </div>

                    <motion.h2
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="text-3xl font-black text-slate-900 tracking-tight mb-4"
                    >
                        QR Thrive is Unavailable
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.35 }}
                        className="text-slate-500 font-medium leading-relaxed mb-10"
                    >
                        We're having trouble reaching the QR Thrive service. It may be temporarily
                        down for maintenance or experiencing a network issue. Please try again shortly.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="space-y-4"
                    >
                        <button
                            onClick={() => {
                                refetchCodes();
                                refetchStats();
                                toast.success('Retrying connection...');
                            }}
                            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-5 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-100 transition-all border border-slate-100 active:scale-95"
                        >
                            Reload Page
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.65 }}
                        className="mt-12 pt-10 border-t border-slate-50 flex flex-col items-center gap-4"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                                Service connection lost
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    if (!isProvisioned) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 lg:p-12">
                <div className="max-w-xl w-full text-center space-y-8">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-blue-600/20 blur-[50px] rounded-full" />
                        <div className="relative w-24 h-24 bg-white rounded-[2rem] border border-slate-100 shadow-xl flex items-center justify-center mx-auto">
                            <Zap className="w-12 h-12 text-blue-600 fill-blue-600" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Activate <span className="text-blue-600">QRThrive</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Create dynamic QR codes, track analytics, and build custom landing pages for your business.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        {[
                            { title: 'Dynamic Codes', desc: 'Change URLs anytime', icon: RefreshCw },
                            { title: 'Full Analytics', desc: 'Track scans and devices', icon: BarChart3 },
                            { title: 'Custom Frames', desc: 'Professional designs', icon: Palette },
                            { title: 'SSO Dashboard', desc: 'Unified experience', icon: ExternalLink },
                        ].map((feat, i) => (
                            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-start gap-4 shadow-sm">
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                    <feat.icon className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm italic">{feat.title}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleProvision}
                            disabled={provisionMutation.isPending}
                            className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                        >
                            {provisionMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Activate Now
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                            Included with your VemTap subscription
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <div className="max-w-7xl mx-auto w-full p-4 lg:p-10">
                
                {view === 'hub' && (
                    <div className="space-y-12">
                        <QRThriveOverviewHeader />
                        <QRThriveMetrics />
                        <QRThriveQuickActions />
                        <QRThriveLeaderboard />
                        <QRThriveCategoriesGrid />
                    </div>
                )}

                {view === 'analytics' && <QRThriveAnalyticsView />}

                {view === 'list' && (
                    <QRThriveManagementView codes={codes || []} onEdit={handleEditCode} />
                )}

                {(view === 'create' || view === 'edit') && (
                    <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex flex-col items-start gap-1">
                            <button 
                                onClick={() => handleSetView('hub')}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 -ml-3 mb-2 flex items-center gap-2 transition-colors bg-transparent border-0 cursor-pointer"
                            >
                                <ArrowLeft size={14} /> Back to Hub
                            </button>
                            <PageHeader 
                                title={view === 'edit' ? "Edit QR Code" : "Create QR Experience"} 
                                description="Configure your custom dynamic QR journey"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => handleSetView('list')}
                                className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
                            >
                                <List className="size-4" /> Back to List
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row relative min-h-[calc(100vh-200px)]">
                        {/* Left Side: Configuration */}
                        <div className="flex-1 w-full lg:pr-[500px] p-4 sm:p-8 lg:p-12 flex flex-col">
                            {/* Stepper */}
                            <div className="flex items-center gap-2 md:gap-4 mb-8 overflow-x-auto no-scrollbar py-2">
                                {STEPS.filter(s => !isLocked || s.id !== 'type').map((s, idx) => (
                                    <React.Fragment key={s.id}>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className={cn(
                                                "size-8 md:size-9 rounded-full flex items-center justify-center text-xs font-black transition-all",
                                                step === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                                                STEPS.findIndex(x => x.id === step) > idx ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] md:text-xs font-black uppercase tracking-tight whitespace-nowrap transition-colors",
                                                step === s.id ? "text-slate-900" : "text-slate-400"
                                            )}>
                                                {s.label}
                                            </span>
                                        </div>
                                        {idx < (isLocked ? 1 : 2) && (
                                            <div className="w-4 h-px bg-slate-200 shrink-0" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {step === 'type' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-2">
                                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">1. Select a type of QR code</h1>
                                            <p className="text-slate-400 font-medium">Click on the type you need to continue.</p>
                                        </div>
                                        <QrTypeSelector 
                                            selectedType={selectedType} 
                                            onSelect={handleTypeSelect}
                                            onHover={setHoveredType}
                                        />
                                    </div>
                                )}

                                {step === 'content' && (
                                    <>
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                                                    {(selectedType as string)?.charAt(0).toUpperCase() + (selectedType as string)?.slice(1)} Content
                                                </h1>
                                                <p className="text-slate-400 font-medium text-xs md:text-sm">Complete the information for your QR Code.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Friendly Name</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. My Website QR"
                                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 font-bold transition-all shadow-sm text-sm"
                                                value={qrName}
                                                onChange={(e) => setQrName(e.target.value)}
                                            />
                                        </div>
                                        <div className="bg-white p-5 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                            <ContentForm 
                                                type={selectedType!} 
                                                data={qrData} 
                                                onChange={setQrData} 
                                                isLocked={isLocked}
                                            />
                                        </div>
                                    </>
                                )}

                                {step === 'design' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-2">
                                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">3. Design your QR code</h1>
                                            <p className="text-slate-400 font-medium">Customize the appearance of your QR code to match your brand.</p>
                                        </div>
                                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                                            <div className="grid grid-cols-3 border-b border-slate-100 p-2 bg-slate-50/50 gap-2">
                                                {(['shape', 'frame', 'logo'] as const).map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setDesignTab(tab)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center gap-1 sm:gap-2 py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-bold uppercase tracking-widest transition-all",
                                                            designTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        {tab === 'shape' && <Palette className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                        {tab === 'frame' && <Frame className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                        {tab === 'logo' && <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                        <span>{tab}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="p-4 sm:p-8">
                                                <DesignPanel 
                                                    design={qrDesign}
                                                    frame={qrFrame}
                                                    onDesignChange={(d) => setQrDesign(prev => ({ ...prev, ...d }))}
                                                    onFrameChange={(f) => setQrFrame(prev => ({ ...prev, ...f }))}
                                                    onLogoUpload={setQrLogo}
                                                    logo={qrLogo}
                                                    activeTab={designTab}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between gap-4">
                                <button
                                    onClick={handleBack}
                                    className={cn(
                                        "flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm sm:text-base",
                                        step === 'type' ? "opacity-0 pointer-events-none" : ""
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
                                </button>
                                
                                <button
                                    onClick={step === 'design' ? handleFinish : handleNext}
                                    disabled={step === 'type' && !selectedType}
                                    className="flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm sm:text-base"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="sm:inline hidden">{step === 'design' ? 'Finish & Save' : 'Next Step'}</span>
                                            <span className="sm:hidden">{step === 'design' ? 'Finish' : 'Next'}</span>
                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                         {/* Right Side: Preview */}
                        <div className="w-full lg:w-[500px] lg:fixed lg:top-20 lg:right-0 lg:bottom-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-30 p-6 sm:p-8 flex flex-col items-center overflow-y-auto custom-scrollbar lg:min-h-0 min-h-[500px]">
                            {/* Toggle */}
                            <div className="mb-8 w-full max-w-[200px] p-1 bg-slate-50 rounded-full border border-slate-100 flex items-center relative group/switcher shadow-sm">
                                <div className={cn(
                                    "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-blue-600 rounded-full shadow-lg shadow-blue-200 transition-all duration-300 ease-out z-10",
                                    previewMode === 'qr' ? "left-[calc(50%+3px)]" : "left-1.5"
                                )} />
                                <button 
                                    onClick={() => setPreviewMode('preview')}
                                    className={cn(
                                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-20 transition-colors duration-300",
                                        previewMode === 'preview' ? "text-white" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Preview
                                </button>
                                <button 
                                    onClick={() => setPreviewMode('qr')}
                                    className={cn(
                                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-20 transition-colors duration-300",
                                        previewMode === 'qr' ? "text-white" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    QR Code
                                </button>
                            </div>

                            {previewMode === 'qr' ? (
                                <QrPreview 
                                    data={qrData?.url || qrData?.text || 'https://qrthrive.com'} 
                                    design={qrDesign}
                                    frame={qrFrame}
                                    logo={qrLogo}
                                    width={280}
                                    height={280}
                                />
                            ) : (
                                <div className={cn('flex flex-col items-center overflow-hidden px-2')}>
                                    <div className={cn(
                                        'relative w-[260px] h-[500px] bg-gray-900 rounded-[40px] p-1.5 shadow-2xl border border-gray-800 overflow-hidden shrink-0'
                                    )}>
                                        <div className={cn(
                                            'absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-900 rounded-b-xl z-50 border-x border-b border-gray-700/50 shadow-md'
                                        )} />
                                        <div className={cn(
                                            'flex-1 relative rounded-[32px] overflow-hidden bg-white flex flex-col h-full min-h-0'
                                        )}>
                                            <div className={cn(
                                                'h-6 px-4 flex items-center justify-between text-[7px] font-bold text-gray-900 pt-1 shrink-0 bg-gray-50/50 border-b border-gray-100/50 z-10'
                                            )}>
                                                <span className={cn('text-[7px] font-black leading-none text-gray-800')}>9:41</span>
                                                <div className={cn('flex items-center gap-1.5')}>
                                                    <svg className={cn('w-3 h-2 text-gray-800 fill-current')} viewBox="0 0 24 24">
                                                        <path d="M18.5 7h-1.1c-.3-.6-.7-1-1.4-1s-1.1.4-1.4 1H9.4c-.3-.6-.7-1-1.4-1s-1.1.4-1.4 1H4.5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>
                                                    </svg>
                                                    <svg className={cn('w-3 h-2.5 text-gray-800 fill-current')} viewBox="0 0 24 24">
                                                        <path d="M20 10h-2.5l-1.5-2h-5l-1.5 2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2z"/>
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className={cn('flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-1 bg-white')}>
                                                <DynamicView data={qrData} isWizardPreview={true} />
                                            </div>
                                            <div className={cn('h-1 w-14 bg-gray-900 rounded-full mx-auto mb-2 shrink-0 opacity-80')} />
                                        </div>
                                    </div>
                                    <div className={cn('mt-4 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2')}>
                                        <div className={cn('w-5 h-5 rounded-md bg-green-100 text-green-600 flex items-center justify-center')}>
                                            <svg className={cn('w-2.5 h-2.5')} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                            </svg>
                                        </div>
                                        <div className={cn('text-left')}>
                                            <p className={cn('text-[8px] font-black text-slate-900 uppercase leading-none')}>Live Preview</p>
                                            <p className={cn('text-[6px] text-slate-400 font-bold uppercase tracking-wider mt-px')}>Real-time</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewMode === 'qr' && (
                                <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3 w-full">
                                    <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-800">Dynamic QR Code</p>
                                        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                                            You can change the destination URL anytime without having to reprint the QR code.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
