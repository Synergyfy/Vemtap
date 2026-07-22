'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useDeviceTapContext, useDeviceTapContextByUsername } from '@/services/devices/hooks';
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

import { PortalWelcome } from '@/components/visitor/PortalWelcome';

interface TapJourneyContainerProps {
    code?: string;
    username?: string;
}

export const TapJourneyContainer: React.FC<TapJourneyContainerProps> = ({ code, username }) => {
    const params = useParams();
    const router = useRouter();
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

    // Fetch context based on either code or username
    const { data: codeContext, isLoading: isCodeLoading, isError: isCodeError } = useDeviceTapContext(code || '');
    const { data: usernameContext, isLoading: isUsernameLoading, isError: isUsernameError } = useDeviceTapContextByUsername(username || '');

    const deviceContext = code ? codeContext : usernameContext;
    const isQueryLoading = code ? isCodeLoading : isUsernameLoading;
    const isError = code ? isCodeError : isUsernameError;
    
    // The device code used for recording visits, etc.
    // If we have a username, the context returns the first active device's code.
    const activeDeviceCode = code || deviceContext?.device?.code;

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

        const isAlreadyOnThisDevice = state.deviceCode === activeDeviceCode && !!state.businessId;
        const isPortalStep = ['PORTAL_MENU', 'PORTAL_LIST', 'PORTAL_DETAIL', 'FORM', 'FORMS_LIST', 'DYNAMIC_FORM', 'SOCIAL_CONNECT'].includes(state.currentStep);
        const isReturningVisitor = deviceContext.device?.isFirstTimeVisit === false;

        const shouldSkipAnimation = true; // Always skip artificial loading delay for instant page loads

        initializeFromBusiness(deviceContext, shouldSkipAnimation);

        if (shouldSkipAnimation) {
            if (!isAuthenticated) {
                setShowInitialAuth(true);
            }
        }
    }, [activeDeviceCode, deviceContext, initializeFromBusiness, isAuthenticated, isMounted]);

    useEffect(() => {
        if (isMounted && isError) {
            router.push('/tap/invalid');
        }
    }, [isError, router, isMounted]);

    useEffect(() => {
        if (currentStep === 'SCANNING') {
            const timer = setTimeout(() => setStep('IDENTIFYING'), 100);
            return () => clearTimeout(timer);
        }
        if (currentStep === 'IDENTIFYING') {
            const timer = setTimeout(() => {
                setStep('PORTAL_MENU');
                if (!isAuthenticated) {
                    setShowInitialAuth(true);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentStep, setStep, isAuthenticated]);

    // Auto-record portal visit once when authenticated customer reaches PORTAL_MENU
    useEffect(() => {
        if (
            currentStep === 'PORTAL_MENU' &&
            isAuthenticated &&
            activeDeviceCode &&
            !portalVisitFired.current
        ) {
            portalVisitFired.current = true;
            const existingToken = sessionToken ?? undefined;
            recordPortalVisit(
                { deviceCode: activeDeviceCode, sessionToken: existingToken },
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
    }, [currentStep, isAuthenticated, activeDeviceCode, sessionToken, setSessionToken, recordPortalVisit]);

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
            router.push(`/b/${activeDeviceCode}/pos`);
        } else if (id === 'service') {
            if (serviceCount === 1) {
                try {
                    const response = await api.get(`/public/catalogue/items/branch/${branchId}?itemType=service&limit=1`);
                    const singleService = response.data?.[0];
                    if (singleService) {
                        router.push(`/${slug}/${activeDeviceCode}/services/${singleService.id}`);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to fetch single service:', error);
                }
            }
            router.push(`/${slug}/${activeDeviceCode}/services`);
        } else if (id === 'offers' || id === 'rewards') {
            router.push(`/${slug}/${activeDeviceCode}/offers`);
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
                const scanResponse = await api.post(`/qr-thrive/public/scan/${shortId}`, {});
                
                if (scanResponse.type === 'url' && scanResponse.destinationUrl) {
                    window.open(scanResponse.destinationUrl, '_blank');
                    return;
                }

                if (scanResponse.type === 'whatsapp') {
                    const qrData = scanResponse.data;
                    const number = qrData?.whatsapp?.phoneNumber || qrData?.whatsapp?.number;
                    const message = qrData?.whatsapp?.message || '';
                    if (number) {
                        const cleanNumber = number.replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
                        return;
                    }
                }

                setSelectedQrShortId(shortId);
                setSelectedQrData(scanResponse);
                setStep('QR_THRIVE_CONTENT' as any);
            } catch (error) {
                console.error('Failed to handle QR action:', error);
                toast.error('Could not load content. Please try again.');
            }
        } else {
            router.push(`/${slug}/${activeDeviceCode}/${id}`);
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

            if (isAuthenticated) {
                const updatedUser = signupResponse?.user || signupResponse;
                const currentToken = useAuthStore.getState().access_token;
                if (currentToken) {
                    login(updatedUser, currentToken);
                }

                setUserData(data);
                setShowInitialAuth(false);
                
                console.log('Registration complete for authenticated user:', updatedUser.email);

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

    if ((isQueryLoading && !deviceContext) || (deviceContext && currentStep === 'SELECT_TYPE')) {
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
            storeName={storeName}
            logoUrl={logoUrl}
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
                            customWelcomeTitle={(engagementSettings as any)?.customWelcomeTitle || "Join to Continue"}
                            customWelcomeTag={(engagementSettings as any)?.customWelcomeTag || "Quickly share your details to proceed with your request."}
                            customWelcomeMessage={(engagementSettings as any)?.customWelcomeMessage || undefined}
                            submitLabel={(engagementSettings as any)?.submitLabel || "Complete Registration"}
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
                            onClick={() => {
                                setShowInitialAuth(false);
                                setPendingAction(null);
                            }}
                            className="absolute inset-0 bg-black/20 backdrop-blur-md"
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
