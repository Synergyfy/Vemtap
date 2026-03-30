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
import { 
    ShoppingBag, 
    Calendar, 
    Gift, 
    MessageSquare, 
    ChevronRight, 
    ShieldCheck,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Sub-components for the Portal ---

const PortalWelcome = ({ 
    branchName, 
    welcomeMessage, 
    logoUrl, 
    onAction,
    productCount = 0,
    serviceCount = 0,
    offerCount = 0
}: { 
    branchName: string, 
    welcomeMessage: string | null, 
    logoUrl: string | null, 
    onAction: (action: string) => void,
    productCount?: number,
    serviceCount?: number,
    offerCount?: number
}) => {
    const actions = [
        { id: 'order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu', count: productCount },
        { id: 'service', label: 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Reservations & Slots', count: serviceCount },
        { id: 'offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals', count: offerCount },
        { id: 'chat', label: 'Support Chat', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Direct Assistance', count: 1 },
    ].filter(action => action.count > 0);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-12 py-4"
        >
            <div className="space-y-4 md:space-y-6">
                <h1 className="text-2xl md:text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight">
                    Welcome to <span className="bg-gradient-to-r from-primary to-secondary-container bg-clip-text text-transparent">{branchName}</span>
                </h1>
                
                <div className="relative w-full aspect-[16/9] bg-primary-container rounded-lg asymmetric-leaf overflow-hidden group shadow-2xl shadow-primary/10">
                    {logoUrl ? (
                        <img alt={branchName} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700 group-hover:scale-105" src={logoUrl} />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-tertiary opacity-40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-5 md:p-8">
                        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-2 md:mb-4 w-fit">Featured Branch</span>
                        <h2 className="text-xl md:text-2xl font-headline font-bold text-white mb-1 md:mb-2 leading-tight">Premium Experience</h2>
                        <p className="text-white/80 text-[10px] md:text-xs mb-4 md:mb-6 max-w-xs">{welcomeMessage || "Experience the best of our services and products tailored just for you."}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {actions.map((item, idx) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        onClick={() => onAction(item.id)}
                        className="group relative flex flex-col gap-3 md:gap-4 p-5 md:p-8 bg-white asymmetric-leaf border border-slate-50 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-left"
                    >
                        <div className={cn("size-12 md:size-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", item.bg, item.color)}>
                            <item.icon size={24} className="md:size-8" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-headline font-bold text-slate-900 tracking-tight">{item.label}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 md:mt-1">{item.desc}</p>
                        </div>
                        <div className="absolute top-5 right-5 md:top-8 md:right-8 size-8 md:size-10 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="text-primary" size={16} />
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="flex justify-center gap-8 py-6 opacity-50 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <ShieldCheck size={14} />
                    Verified
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={14} />
                    Fast Support
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Page Component ---

export default function DynamicTapJourneyPage() {
    const params = useParams();
    const router = useRouter();
    const deviceCode = params.code as string;

    const {
        currentStep, setStep, storeName, setUserData, resetFlow,
        initializeFromBusiness, branchId, logoUrl, businessId,
        customWelcomeMessage, productCount, serviceCount, offerCount
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
        
        // Ultimate skip logic:
        // 1. We already have the session for THIS device in the store
        // 2. The portal is ALREADY active (never revert to scanning)
        // 3. The backend says this device visit is not a first-time visit
        const isAlreadyOnThisDevice = state.deviceCode === deviceCode && !!state.businessId;
        const isPortalStep = ['PORTAL_MENU', 'PORTAL_LIST', 'PORTAL_DETAIL', 'FORM'].includes(state.currentStep);
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
            router.push(`/${params.slug}/${deviceCode}/products`);
        } else if (id === 'service') {
            router.push(`/${params.slug}/${deviceCode}/services`);
        } else if (id === 'offers') {
            router.push(`/${params.slug}/${deviceCode}/offers`);
        } else if (id === 'chat') {
            const navigateToChat = () => {
                const businessBranchId = branchId || businessId;
                router.push(`/customer/messaging/chat?branchId=${businessBranchId}`);
            };

            if (!isAuthenticated) {
                setPendingAction(() => navigateToChat);
                setStep('FORM');
            } else {
                navigateToChat();
            }
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
                                welcomeMessage={customWelcomeMessage}
                                logoUrl={logoUrl}
                                onAction={handleAction}
                                productCount={productCount}
                                serviceCount={serviceCount}
                                offerCount={offerCount}
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
                                                // Optional: allow back to re-scan or just close
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
            </AnimatePresence>
        </VisitorLayout>
    );
}
