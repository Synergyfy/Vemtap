'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useDeviceTapContext } from '@/services/devices/hooks';
import { useRecordPortalVisit } from '@/services/visits/hooks';
import { api } from '@/lib/api';

// Components
import { VisitorLayout } from '@/components/visitor/VisitorLayout';
import { StepScanning } from '@/components/visitor/StepScanning';
import { StepIdentifying } from '@/components/visitor/StepIdentifying';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { StepSocialConnect } from '@/components/visitor/StepSocialConnect';
import { StepFormList } from '@/components/visitor/StepFormList';
import { StepDynamicForm } from '@/components/visitor/StepDynamicForm';
import { StepQrThriveContent } from '@/components/visitor/StepQrThriveContent';
import { getQrIcon, getQrDescription } from '@/lib/utils/qr-icons';
import {
    ShoppingBag,
    Calendar,
    Gift,
    ChevronRight,
    ShieldCheck,
    Clock,
    ClipboardList,
    Share2,
    Link2,
    FileText,
    Image as ImageIcon,
    Contact
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FaWhatsapp } from 'react-icons/fa';

// --- Sub-components for the Portal ---

const PortalWelcome = ({
    branchName,
    logoUrl,
    welcomeMessage,
    onAction,
    productCount,
    serviceCount,
    offerCount,
    formCount,
    isFirstTimeVisit,
    isReturningUser,
    engagement,
    whatsappNumber,
    qrThriveCodes,
    availableForms,
    availableRewards,
    ublSequence,
    brandColor
}: {
    branchName: string,
    logoUrl?: string,
    welcomeMessage?: string,
    onAction: (id: string) => void,
    productCount?: number,
    serviceCount?: number,
    offerCount?: number,
    formCount?: number,
    isFirstTimeVisit?: boolean,
    isReturningUser?: boolean,
    engagement?: any,
    whatsappNumber?: string | null,
    qrThriveCodes?: any[],
    availableForms?: any[],
    availableRewards?: any[],
    ublSequence?: string[],
    brandColor?: string
}) => {
    const isServiceOnly = serviceCount && serviceCount > 0 && (!productCount || productCount === 0);

    const dynamicActions = useMemo(() => {
        const sequenceToUse = ublSequence && ublSequence.length > 0 ? ublSequence : [];
        if (sequenceToUse.length === 0) return null;

        const formMap = new Map(availableForms?.map(f => [f.id, f]) || []);
        const rewardMap = new Map(availableRewards?.map(r => [r.id, r]) || []);
        const qrMap = new Map(qrThriveCodes?.map(q => [q.id, q]) || []);

        return sequenceToUse.map(id => {
            // System Actions
            if (id === 'system:order') return { id: 'order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu', count: productCount };
            if (id === 'system:service') return { id: 'service', label: isServiceOnly ? 'Book Appointment' : 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: isServiceOnly ? 'Secure Your Time Slot' : 'Reservations & Slots', count: serviceCount };
            if (id === 'system:offers') return { id: 'offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals', count: offerCount };
            if (id === 'system:whatsapp') return { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: 'text-green-500', bg: 'bg-green-50', desc: 'Instant Support', count: whatsappNumber ? 1 : 0 };
            if (id === 'system:forms') return { id: 'forms', label: 'Fill Feedback', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Share your thoughts', count: formCount };
            if (id === 'system:engagement') return { id: 'engagement', label: 'Social Connect', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Follow us online', count: Object.keys(engagement || {}).length > 0 ? 1 : 0 };

            // Custom Items
            const form = formMap.get(id);
            if (form) return { id: `form-${form.uniqueCode}`, label: form.title, icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Feedback Form', count: 1 };
            
            const reward = rewardMap.get(id);
            if (reward) return { id: 'rewards', label: reward.name, icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Loyalty Reward', count: 1 };
            
            const qr = qrMap.get(id);
            if (qr) return {
                id: `qr-${qr.shortId}`,
                label: qr.name,
                icon: getQrIcon(qr.type),
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                desc: getQrDescription(qr.type),
                isQr: true,
                qrType: qr.type,
                shortId: qr.shortId,
                count: 1
            };
            return null;
        }).filter(action => action && (action as any).count !== 0);
    }, [ublSequence, availableForms, availableRewards, qrThriveCodes, productCount, serviceCount, isServiceOnly, offerCount, whatsappNumber, formCount, engagement]);

    const actions = useMemo(() => {
        if (dynamicActions) return dynamicActions;

        // Fallback for legacy / no sequence defined
        return [
            { id: 'order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu', count: productCount },
            { id: 'service', label: isServiceOnly ? 'Book Appointment' : 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: isServiceOnly ? 'Secure Your Time Slot' : 'Reservations & Slots', count: serviceCount },
            { id: 'offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals', count: offerCount },
            { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: 'text-green-500', bg: 'bg-green-50', desc: 'Instant Support', count: whatsappNumber ? 1 : 0 },
            { id: 'forms', label: 'Fill Feedback', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Share your thoughts', count: formCount },
            ...(qrThriveCodes || []).map((code: any) => ({
                id: `qr-${code.shortId}`,
                label: code.name,
                icon: code.type === 'pdf' ? FileText : 
                      code.type === 'image' ? ImageIcon : 
                      code.type === 'vcard' ? Contact : Link2,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                desc: code.type.toUpperCase(),
                count: 1,
                isExternal: true,
                url: `https://api.qrthrive.com/s/${code.shortId}`
            })),
            { id: 'engagement', label: 'Social Connect', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Follow us online', count: Object.keys(engagement || {}).length > 0 ? 1 : 0 },
        ].filter(action => (action as any).count !== 0);
    }, [dynamicActions, productCount, serviceCount, isServiceOnly, offerCount, whatsappNumber, formCount, qrThriveCodes, engagement]);

    // If service only, and no custom sequence, sort to put it first
    if (isServiceOnly && !ublSequence?.length) {
        (actions as any[]).sort((a, b) => a.id === 'service' ? -1 : (b.id === 'service' ? 1 : 0));
    }

    const useGrid = actions.length >= 4;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full space-y-4 md:space-y-6 pt-0 pb-6"
        >
            <div className="flex items-center gap-4 mb-4 border-b border-slate-100/50 pb-4">
                {logoUrl ? (
                    <div className="size-12 md:size-16 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white shrink-0 transition-transform group-hover:scale-105">
                        <img src={logoUrl} alt={branchName} className="size-full object-cover" />
                    </div>
                ) : (
                    <div className="size-12 md:size-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shrink-0">
                        <span className="font-headline font-black text-lg md:text-xl uppercase tracking-tighter">
                            {branchName.charAt(0)}
                        </span>
                    </div>
                )}
                <div className="space-y-0.5 flex-grow">
                    <h1 className="text-sm md:text-2xl font-headline font-bold text-on-surface leading-tight tracking-tight">
                        Welcome to {branchName}
                    </h1>
                    <p className="text-on-surface-variant text-[7px] md:text-[10px] max-w-xs font-medium opacity-70 italic">
                        {welcomeMessage || "Select an option below to get started"}
                    </p>
                </div>
            </div>

            <div className={cn(
                "gap-3 md:gap-4",
                useGrid ? "grid grid-cols-2" : "flex flex-col"
            )}>
                {actions.filter(item => item !== null).map((item, idx) => (
                    <motion.button
                        key={item!.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        onClick={() => (item as any).isExternal ? window.open((item as any).url, '_blank') : onAction(item!.id)}
                        className={cn(
                            "group relative flex border border-slate-50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-left overflow-hidden bg-white asymmetric-leaf",
                            useGrid
                                ? "flex-col gap-3 md:gap-5 p-5 md:p-8"
                                : "flex-row items-center gap-4 md:gap-5 p-4 md:p-5 w-full"
                        )}
                    >
                        <div className={cn(
                            "rounded-lg md:rounded-xl flex items-center justify-center shadow-inner shrink-0 transition-transform group-hover:scale-105",
                            item!.bg,
                            item!.color,
                            useGrid ? "size-12 md:size-16" : "size-11 md:size-13"
                        )}>
                            {React.createElement(item!.icon, { 
                                size: useGrid ? 24 : 20, 
                                className: useGrid ? "md:size-8" : "md:size-6", 
                                strokeWidth: 2.5 
                            })}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 
                                className={cn(
                                    "font-headline font-bold tracking-tight leading-snug",
                                    useGrid ? "text-sm md:text-xl" : "text-xs md:text-base"
                                )}
                                style={{ color: brandColor || '#0f172a' }}
                            >{item!.label}</h3>
                            <p className={cn(
                                "text-slate-400 font-bold uppercase tracking-widest mt-0.5",
                                useGrid ? "text-[8px] md:text-[10px]" : "text-[7px] md:text-[10px]"
                            )}>{item!.desc}</p>
                        </div>
                        <div className={cn(
                            "p-1 opacity-10 group-hover:opacity-100 transition-opacity",
                            useGrid ? "absolute top-5 right-5 md:top-8 md:right-8" : "shrink-0"
                        )}>
                            <ChevronRight className="text-primary" size={useGrid ? 16 : 14} />
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="flex justify-center gap-6 py-4 opacity-40 border-t border-slate-100/50">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <ShieldCheck size={12} />
                    Verified
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={12} />
                    Instant Service
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Page Component ---

const DynamicTapJourneyPage = () => {
    const params = useParams();
    const router = useRouter();
    const deviceCode = params.code as string;
    const slug = params.slug as string;

    const {
        currentStep, setStep, storeName, setUserData, resetFlow,
        initializeFromBusiness, branchId, logoUrl, businessId,
        customWelcomeMessage, productCount, serviceCount, offerCount,
        formCount, engagementSettings, selectedFormCode, setSelectedFormCode,
        sessionToken, setSessionToken, whatsappNumber, qrThriveCodes
    } = useCustomerFlowStore();

    const [selectedQrShortId, setSelectedQrShortId] = useState<string | null>(null);
    const [selectedQrData, setSelectedQrData] = useState<any>(null);

    const { data: availableForms } = useQuery<any[]>({
        queryKey: ['visitor-forms', branchId],
        queryFn: async () => {
            const response = await api.get(`/visitor-forms/branch/${branchId}`);
            return Array.isArray(response) ? response : (response as any)?.data || [];
        },
        enabled: !!branchId
    });

    const { data: availableRewards } = useQuery<any[]>({
        queryKey: ['visitor-rewards', branchId],
        queryFn: async () => {
            const response = await api.get(`/loyalty/rewards/branch/${branchId}`);
            return Array.isArray(response) ? response : (response as any)?.data || [];
        },
        enabled: !!branchId
    });

    const { user, isAuthenticated, login, logout } = useAuthStore();

    const { data: deviceContext, isLoading: isQueryLoading, isError } = useDeviceTapContext(deviceCode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInitialAuth, setShowInitialAuth] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const portalVisitFired = useRef(false);

    const { mutate: recordPortalVisit } = useRecordPortalVisit();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !deviceContext) return;

        const state = useCustomerFlowStore.getState();

        const isAlreadyOnThisDevice = state.deviceCode === deviceCode && !!state.businessId;
        const isPortalStep = ['PORTAL_MENU', 'PORTAL_LIST', 'PORTAL_DETAIL', 'FORM', 'FORMS_LIST', 'DYNAMIC_FORM', 'SOCIAL_CONNECT'].includes(state.currentStep);
        const isReturningVisitor = deviceContext.device?.isFirstTimeVisit === false;

        const shouldSkipAnimation = isAlreadyOnThisDevice || isPortalStep || isReturningVisitor;

        initializeFromBusiness(deviceContext, shouldSkipAnimation);

        if (shouldSkipAnimation) {
            if (!isAuthenticated) {
                setShowInitialAuth(true);
            }
        }
    }, [deviceCode, deviceContext, initializeFromBusiness, isAuthenticated, isMounted]);

    useEffect(() => {
        if (isMounted && isError) {
            router.push('/tap/invalid');
        }
    }, [isError, router, isMounted]);

    useEffect(() => {
        if (currentStep === 'SCANNING') {
            const timer = setTimeout(() => setStep('IDENTIFYING'), 1200);
            return () => clearTimeout(timer);
        }
        if (currentStep === 'IDENTIFYING') {
            const timer = setTimeout(() => {
                setStep('PORTAL_MENU');
                if (!isAuthenticated) {
                    setShowInitialAuth(true);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentStep, setStep, isAuthenticated]);

    // Auto-record portal visit once when authenticated customer reaches PORTAL_MENU
    useEffect(() => {
        if (
            currentStep === 'PORTAL_MENU' &&
            isAuthenticated &&
            deviceCode &&
            !portalVisitFired.current
        ) {
            portalVisitFired.current = true;
            const existingToken = sessionToken ?? undefined;
            recordPortalVisit(
                { deviceCode, sessionToken: existingToken },
                {
                    onSuccess: (data) => {
                        // Store the server-confirmed token for use at checkout
                        setSessionToken(data.sessionToken);
                    },
                    onError: () => {
                        // Silently fail — visit recording is non-blocking
                        portalVisitFired.current = false;
                    },
                },
            );
        }
    }, [currentStep, isAuthenticated, deviceCode, sessionToken, setSessionToken, recordPortalVisit]);

    // Handle auto-opening QR codes from URL params
    useEffect(() => {
        if (!isMounted || !deviceContext || currentStep !== 'PORTAL_MENU') return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const qrId = urlParams.get('qr');
        if (qrId) {
            // Wait a bit for the UI to stabilize
            const timer = setTimeout(() => {
                handleAction(`qr-${qrId}`);
                // Remove the param from URL to prevent re-triggering
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isMounted, deviceContext, currentStep]);

    const handleAction = async (id: string) => {
        if (id === 'order') {
            router.push(`/${slug}/${deviceCode}/products`);
        } else if (id === 'service') {
            if (serviceCount === 1) {
                try {
                    // Fetch the single service to get its ID
                    const response = await api.get(`/public/catalogue/items/branch/${branchId}?itemType=service&limit=1`);
                    const singleService = response.data?.[0];
                    if (singleService) {
                        router.push(`/${slug}/${deviceCode}/services/${singleService.id}`);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to fetch single service:', error);
                }
            }
            router.push(`/${slug}/${deviceCode}/services`);
        } else if (id === 'offers' || id === 'rewards') {
            router.push(`/${slug}/${deviceCode}/offers`);
        } else if (id === 'forms') {
            setStep('FORMS_LIST');
        } else if (id.startsWith('form-')) {
            const formCode = id.replace('form-', '');
            setSelectedFormCode(formCode);
            setStep('DYNAMIC_FORM');
        } else if (id === 'engagement') {
            setStep('SOCIAL_CONNECT');
        } else if (id === 'whatsapp') {
            if (whatsappNumber) {
                const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${cleanNumber}`, '_blank');
            }
        } else if (id.startsWith('qr-')) {
            const shortId = id.replace('qr-', '');
            try {
                // Record scan locally and get full data via VemTap proxy
                // This ensures we record stats on our end and QR-Thrive's end
                const scanResponse = await api.post(`/qr-thrive/public/scan/${shortId}`, {});
                
                // If it's a URL type, open in new tab
                if (scanResponse.type === 'url' && scanResponse.destinationUrl) {
                    window.open(scanResponse.destinationUrl, '_blank');
                    return;
                }

                // Show other content in-page using StepQrThriveContent
                setSelectedQrShortId(shortId);
                setSelectedQrData(scanResponse);
                setStep('QR_THRIVE_CONTENT' as any);
            } catch (error) {
                console.error('Failed to handle QR action:', error);
                toast.error('Could not load content. Please try again.');
            }
        } else {
            router.push(`/${slug}/${deviceCode}/${id}`);
        }
    };

    const onRegistrationComplete = async (data: StepFormData) => {
        setIsSubmitting(true);
        try {
            const nameParts = data.name?.trim().split(/\s+/) || ['Visitor'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || ' ';
            const defaultPassword = '123456';

            const signupResponse = await api.post(`/visitors/signup`, {
                firstName,
                lastName,
                email: data.email,
                phone: data.phone || undefined
            });

            // If already authenticated (e.g. via Google), we just needed to sync profile/record visit
            if (isAuthenticated) {
                // Update local user state with the data from signup response if possible, 
                // or just use the form data we have.
                const updatedUser = signupResponse?.user || signupResponse;
                
                // We use login here to essentially "re-sync" the user object while keeping the current token
                const currentToken = useAuthStore.getState().access_token;
                if (currentToken) {
                    login(updatedUser, currentToken);
                }

                setUserData(data);
                setShowInitialAuth(false);

                if (pendingAction) {
                    await pendingAction();
                    setPendingAction(null);
                }
                return;
            }

            const authResponse = await api.post('/auth/login', {
                identifier: data.email,
                password: defaultPassword
            });

            if (authResponse?.access_token) {
                login(authResponse.user, authResponse.access_token);
                setUserData(data);
                setShowInitialAuth(false);

                if (pendingAction) {
                    await pendingAction();
                    setPendingAction(null);
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isQueryLoading && !deviceContext) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Setting up portal...</p>
                </div>
            </div>
        );
    }

    return (
        <VisitorLayout
            onReset={resetFlow}
            brandColor={engagementSettings?.brandColor}
        >
            {isAuthenticated && user && (
                <div className="w-full flex justify-end mb-4 relative z-[210]">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-100 shadow-sm transition-all hover:bg-white hover:shadow-md"
                    >
                        <div className="size-1.5 bg-green-500 rounded-full" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {user.email}
                        </span>
                        <button
                            onClick={() => {
                                logout();
                                toast.success('Logged out');
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors border-l border-slate-200 pl-2.5 ml-0.5"
                        >
                            Log out
                        </button>
                    </motion.div>
                </div>
            )}
            <div className={cn(
                "relative w-full transition-all duration-700",
                showInitialAuth ? "blur-2xl scale-[0.98] pointer-events-none opacity-60" : "blur-0 scale-100"
            )}>
                <AnimatePresence mode="wait">
                    {currentStep === 'SCANNING' && <StepScanning key="scanning" storeName={storeName} />}

                    {currentStep === 'IDENTIFYING' && <StepIdentifying key="identifying" />}

                    {currentStep === 'PORTAL_MENU' && (
                        <PortalWelcome
                            key="portal-menu"
                            branchName={storeName}
                            welcomeMessage={customWelcomeMessage || undefined}
                            logoUrl={logoUrl || undefined}
                            onAction={handleAction}
                            productCount={productCount}
                            serviceCount={serviceCount}
                            offerCount={offerCount}
                            formCount={formCount}
                            isFirstTimeVisit={deviceContext?.device?.isFirstTimeVisit ?? true}
                            isReturningUser={!!deviceContext?.device?.isReturningUser}
                            engagement={engagementSettings}
                            whatsappNumber={whatsappNumber}
                            qrThriveCodes={qrThriveCodes}
                            availableForms={availableForms}
                            availableRewards={availableRewards}
                            ublSequence={engagementSettings?.ublSequence}
                            brandColor={engagementSettings?.brandColor}
                        />
                    )}

                    {currentStep === 'FORM' && (
                        <StepForm
                            key="form-step"
                            storeName={storeName}
                            logoUrl={logoUrl}
                            customWelcomeTitle="Join to Continue"
                            customWelcomeMessage="Quickly share your details to proceed with your request."
                            submitLabel="Complete Registration"
                            isSubmitting={isSubmitting}
                            onBack={() => {
                                setPendingAction(null);
                                setStep('PORTAL_MENU');
                            }}
                            onSubmit={onRegistrationComplete}
                        />
                    )}

                    {currentStep === 'SOCIAL_CONNECT' && (
                        <StepSocialConnect
                            key="social"
                            storeName={storeName}
                            logoUrl={logoUrl}
                            engagement={engagementSettings}
                            onBack={() => setStep('PORTAL_MENU')}
                        />
                    )}

                    {currentStep === 'FORMS_LIST' && (
                        <StepFormList
                            key="forms-list"
                            branchId={branchId || ''}
                            storeName={storeName}
                            logoUrl={logoUrl}
                            onSelect={(form) => {
                                setSelectedFormCode(form.uniqueCode);
                                setStep('DYNAMIC_FORM');
                            }}
                            onBack={() => setStep('PORTAL_MENU')}
                        />
                    )}

                    {currentStep === 'DYNAMIC_FORM' && selectedFormCode && (
                        <StepDynamicForm
                            key={`dynamic-form-${selectedFormCode}`}
                            formCode={selectedFormCode}
                            storeName={storeName}
                            logoUrl={logoUrl}
                            isAuthenticated={isAuthenticated}
                            onRequireAuth={(action) => {
                                setPendingAction(() => action);
                                setShowInitialAuth(true);
                            }}
                            onBack={() => setStep('FORMS_LIST')}
                            onSuccess={() => {
                                setStep('FORMS_LIST');
                            }}
                        />
                    )}
                    {currentStep === 'QR_THRIVE_CONTENT' as any && selectedQrData && (
                        <StepQrThriveContent
                            key={`qr-thrive-content-${selectedQrShortId}`}
                            qrCode={selectedQrData}
                            onBack={() => setStep('PORTAL_MENU')}
                        />
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showInitialAuth && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/5 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg"
                        >
                            <StepForm
                                storeName={storeName}
                                logoUrl={logoUrl}
                                customWelcomeTitle={pendingAction ? "Identification Required" : "One Last Step"}
                                customWelcomeMessage={pendingAction ? "Please share your details to proceed with your submission." : "Please share your details to unlock our premium services and exclusive rewards."}
                                submitLabel={pendingAction ? "Identify & Submit" : "Start My Experience"}
                                isSubmitting={isSubmitting}
                                onBack={() => {
                                    setShowInitialAuth(false);
                                    setPendingAction(null);
                                }}
                                onSubmit={onRegistrationComplete}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </VisitorLayout>
    );
};

export default DynamicTapJourneyPage;
