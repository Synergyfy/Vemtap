'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import {
    ShoppingBag,
    Calendar,
    Gift,
    ChevronRight,
    ShieldCheck,
    Clock,
    ClipboardList,
    Share2,
    Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    whatsappNumber
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
    whatsappNumber?: string | null
}) => {
    const actions = [
        { id: 'order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu', count: productCount },
        { id: 'service', label: 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Reservations & Slots', count: serviceCount },
        { id: 'offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals', count: offerCount },
        { id: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'text-green-500', bg: 'bg-green-50', desc: 'Instant Support', count: whatsappNumber ? 1 : 0 },
        { id: 'forms', label: 'Fill Feedback', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Share your thoughts', count: formCount },
        { id: 'engagement', label: 'Social Connect', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Follow us online', count: Object.keys(engagement || {}).length > 0 ? 1 : 0 },
    ].filter(action => action.count && action.count > 0);

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
                    <h1 className="text-lg md:text-2xl font-headline font-bold text-on-surface leading-tight tracking-tight">
                        Welcome to {branchName}
                    </h1>
                    <p className="text-on-surface-variant text-[9px] md:text-[10px] max-w-xs font-medium opacity-70 italic line-clamp-1">
                        {welcomeMessage || "Select an option below to get started"}
                    </p>
                </div>
            </div>

            <div className={cn(
                "gap-3 md:gap-4",
                useGrid ? "grid grid-cols-2" : "flex flex-col"
            )}>
                {actions.map((item, idx) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        onClick={() => onAction(item.id)}
                        className={cn(
                            "group relative flex border border-slate-50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-left overflow-hidden bg-white asymmetric-leaf",
                            useGrid
                                ? "flex-col gap-3 md:gap-5 p-5 md:p-8"
                                : "flex-row items-center gap-4 md:gap-5 p-4 md:p-5 w-full"
                        )}
                    >
                        <div className={cn(
                            "rounded-lg md:rounded-xl flex items-center justify-center shadow-inner shrink-0 transition-transform group-hover:scale-105",
                            item.bg,
                            item.color,
                            useGrid ? "size-12 md:size-16" : "size-11 md:size-13"
                        )}>
                            <item.icon size={useGrid ? 24 : 20} className={useGrid ? "md:size-8" : "md:size-6"} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className={cn(
                                "font-headline font-bold text-slate-900 tracking-tight leading-tight truncate",
                                useGrid ? "text-lg md:text-xl" : "text-sm md:text-base"
                            )}>{item.label}</h3>
                            <p className={cn(
                                "text-slate-400 font-bold uppercase tracking-widest mt-0.5",
                                useGrid ? "text-[10px]" : "text-[9px] md:text-[10px]"
                            )}>{item.desc}</p>
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
        sessionToken, setSessionToken, whatsappNumber
    } = useCustomerFlowStore();

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

    const handleAction = (id: string) => {
        if (id === 'order') {
            router.push(`/${slug}/${deviceCode}/products`);
        } else if (id === 'service') {
            router.push(`/${slug}/${deviceCode}/services`);
        } else if (id === 'offers') {
            router.push(`/${slug}/${deviceCode}/offers`);
        } else if (id === 'forms') {
            setStep('FORMS_LIST');
        } else if (id === 'engagement') {
            setStep('SOCIAL_CONNECT');
        } else if (id === 'whatsapp') {
            if (whatsappNumber) {
                const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${cleanNumber}`, '_blank');
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
                phone: data.phone
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
            brandColor={useCustomerFlowStore.getState().engagementSettings?.brandColor}
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
