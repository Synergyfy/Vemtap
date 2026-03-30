'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useDeviceTapContext } from '@/services/devices/hooks';
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
    Share2
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
    engagement
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
    engagement?: any
}) => {
    const actions = [
        { id: 'order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu', count: productCount },
        { id: 'service', label: 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Reservations & Slots', count: serviceCount },
        { id: 'offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals', count: offerCount },
        { id: 'forms', label: 'Fill Feedback', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Share your thoughts', count: formCount },
        { id: 'engagement', label: 'Social Connect', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Follow us online', count: Object.keys(engagement || {}).length > 0 ? 1 : 0 },
    ].filter(action => action.count && action.count > 0);

    const isCompact = actions.length <= 4;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
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

            <div className="grid grid-cols-2 gap-3 md:gap-6">
                {actions.map((item, idx) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        onClick={() => onAction(item.id)}
                        className={cn(
                            "group relative flex border border-slate-50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-left overflow-hidden bg-white asymmetric-leaf",
                            isCompact 
                                ? "flex-row items-center gap-2 md:gap-4 p-2.5 md:p-6" 
                                : "flex-col gap-3 md:gap-5 p-5 md:p-8"
                        )}
                    >
                        <div className={cn(
                            "rounded-lg md:rounded-xl flex items-center justify-center shadow-inner shrink-0 transition-transform group-hover:scale-105",
                            item.bg, 
                            item.color,
                            isCompact ? "size-10 md:size-14" : "size-12 md:size-16"
                        )}>
                            <item.icon size={isCompact ? 18 : 24} className={isCompact ? "md:size-7" : "md:size-8"} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                            <h3 className={cn(
                                "font-headline font-bold text-slate-900 tracking-tight leading-tight truncate",
                                isCompact ? "text-[11px] md:text-lg" : "text-lg md:text-xl"
                            )}>{item.label}</h3>
                            <p className={cn(
                                "text-slate-400 font-bold uppercase tracking-widest mt-0.5",
                                isCompact ? "text-[8px] hidden md:block" : "text-[10px]"
                            )}>{item.desc}</p>
                        </div>
                        <div className={cn(
                            "absolute p-1 opacity-10 group-hover:opacity-100 transition-opacity",
                            isCompact ? "-right-1 bottom-0" : "top-5 right-5 md:top-8 md:right-8"
                        )}>
                            <ChevronRight className="text-primary" size={isCompact ? 12 : 16} />
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
        formCount, engagementSettings, selectedFormCode, setSelectedFormCode
    } = useCustomerFlowStore();

    const { isAuthenticated, login } = useAuthStore();
    
    const { data: deviceContext, isLoading: isQueryLoading, isError } = useDeviceTapContext(deviceCode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInitialAuth, setShowInitialAuth] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [isMounted, setIsMounted] = useState(false);

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

            await api.post(`/visitors/signup`, {
                firstName,
                lastName,
                email: data.email,
                phone: data.phone
            });

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
            <AnimatePresence mode="wait">
                {currentStep === 'SCANNING' && <StepScanning storeName={storeName} />}
                
                {currentStep === 'IDENTIFYING' && <StepIdentifying />}

                {currentStep === 'PORTAL_MENU' && (
                    <div className="relative w-full">
                        <div className={cn(
                            "transition-all duration-700",
                            showInitialAuth ? "blur-2xl scale-[0.98] pointer-events-none opacity-60" : "blur-0 scale-100"
                        )}>
                            <PortalWelcome 
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
                            />
                        </div>

                        <AnimatePresence>
                            {showInitialAuth && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                                            customWelcomeTitle="One Last Step"
                                            customWelcomeMessage="Please share your details to unlock our premium services and exclusive rewards."
                                            submitLabel="Start My Experience"
                                            isSubmitting={isSubmitting}
                                            onBack={() => {
                                                setShowInitialAuth(false);
                                            }}
                                            onSubmit={onRegistrationComplete}
                                        />
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {currentStep === 'FORM' && (
                    <StepForm
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
                        storeName={storeName}
                        logoUrl={logoUrl}
                        engagement={engagementSettings}
                        onBack={() => setStep('PORTAL_MENU')}
                    />
                )}

                {currentStep === 'FORMS_LIST' && (
                    <StepFormList 
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
                        formCode={selectedFormCode}
                        storeName={storeName}
                        logoUrl={logoUrl}
                        onBack={() => setStep('FORMS_LIST')}
                        onSuccess={() => {
                            setStep('FORMS_LIST');
                        }}
                    />
                )}
            </AnimatePresence>
        </VisitorLayout>
    );
};

export default DynamicTapJourneyPage;
