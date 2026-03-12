'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import { fetchDeviceByCode } from '@/lib/api/devices';

// Modular Components
import { VisitorLayout } from '@/components/visitor/VisitorLayout';
import { StepSelectType } from '@/components/visitor/StepSelectType';
import { StepScanning } from '@/components/visitor/StepScanning';
import { StepIdentifying } from '@/components/visitor/StepIdentifying';
import { StepForm } from '@/components/visitor/StepForm';
import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { StepSurvey } from '@/components/visitor/StepSurvey';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { StepFinalSuccess } from '@/components/visitor/StepFinalSuccess';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { EarnPointsModal } from '@/components/loyalty/EarnPointsModal';
import { loyaltyApi } from '@/lib/api/loyalty';
import { api } from '@/lib/api';
import { useBusinessForms, useSubmitBusinessFormResponse, useFormsByDevice } from '@/services/business-forms/hooks';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';

export default function DynamicTapJourneyPage() {
    const params = useParams();
    const router = useRouter();
    const deviceCode = params.code as string;
    const businessSlug = params.slug as string;

    const {
        currentStep, setStep, storeName, setUserData, resetFlow,
        getBusinessConfig, customWelcomeMessage, customWelcomeTitle, customWelcomeButton, customWelcomeTag, customSuccessMessage,
        customPrivacyMessage, customRewardMessage, hasRewardSetup,
        setBusinessType, userData, branchId, logoUrl, visitCount, rewardVisitThreshold,
        redemptionStatus, lastRedemptionId, requestRedemption, setRedemptionStatus, resetVisitCountAfterRedemption,
        engagementSettings, surveyQuestions,
        customNewUserWelcomeMessage, customNewUserWelcomeTitle, customNewUserWelcomeTag,
        businessId, initializeFromBusiness, recordVisit, isFirstTimeVisit
    } = useCustomerFlowStore();

    const addRedemptionRequest = useMockDashboardStore(state => state.addRedemptionRequest);
    const redemptionRequests = useMockDashboardStore(state => state.redemptionRequests);

    const { user, isAuthenticated, login, access_token, logout } = useAuthStore();
    const { lastEarnedResponse, setLastEarnedResponse } = useLoyaltyStore();
    const config = getBusinessConfig();

    const [selectedBusinessFormId, setSelectedBusinessFormId] = useState<string | null>(null);

    // Fetch forms for this device/branch
    const { data: deviceForms = [], isLoading: formsLoading } = useFormsByDevice(deviceCode || '');
    const { data: businessForms = [] } = useBusinessForms();

    const submitBusinessFormResponse = useSubmitBusinessFormResponse(selectedBusinessFormId || '');
    const getDefaultFormId = useFormPreferencesStore((state) => state.getDefaultFormId);
    const getActiveFormIds = useFormPreferencesStore((state) => state.getActiveFormIds);
    const formBranchScope = branchId || 'global';
    const defaultFormId = getDefaultFormId(formBranchScope);
    const locallyActiveFormIds = getActiveFormIds(formBranchScope);

    const approvedFormsForBusiness = useMemo(
        () =>
            businessForms.filter(
                (f) =>
                    f.isPublished &&
                    f.isActive &&
                    (!businessId || f.businessId === businessId) &&
                    (!branchId || f.branchId === branchId)
            ),
        [branchId, businessForms, businessId]
    );

    const selectedBusinessForm = useMemo(
        () => [...approvedFormsForBusiness, ...deviceForms].find((f) => f.id === selectedBusinessFormId) || null,
        [approvedFormsForBusiness, deviceForms, selectedBusinessFormId]
    );

    const preferredBusinessForm = useMemo(() => {
        // Check if any device form is marked as default/preferred (backend driven)
        const deviceDefault = deviceForms.find(f => f.showAfterLeadCapture);

        const branchDefault = defaultFormId
            ? approvedFormsForBusiness.find((form) => form.id === defaultFormId)
            : undefined;

        return deviceDefault || branchDefault || approvedFormsForBusiness[0] || null;
    }, [approvedFormsForBusiness, defaultFormId, deviceForms]);

    const attachedBusinessForms = useMemo(
        () => {
            // Combine device-specific forms with locally active ones
            const deviceSpecific = deviceForms.filter(f => f.id !== preferredBusinessForm?.id);
            const others = approvedFormsForBusiness.filter(f => locallyActiveFormIds.includes(f.id) && f.id !== preferredBusinessForm?.id);

            // Remove duplicates by ID
            const combined = [...deviceSpecific, ...others];
            return Array.from(new Map(combined.map(item => [item.id, item])).values());
        },
        [deviceForms, preferredBusinessForm?.id, approvedFormsForBusiness, locallyActiveFormIds]
    );

    const isCustomer = isAuthenticated && user?.role?.toLowerCase() === 'customer';

    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSyncingReal, setIsSyncingReal] = useState(false);
    const [isDeviceSynced, setIsDeviceSynced] = useState(false);
    const [hasVisitedBefore, setHasVisitedBefore] = useState(false);

    // 0. Early Token Expiration Check
    useEffect(() => {
        if (isAuthenticated && access_token) {
            try {
                const decoded: any = jwtDecode(access_token);
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    console.warn('[TAP JOURNEY] Session expired, logging out...');
                    logout();
                }
            } catch (err) {
                console.error('[TAP JOURNEY] Failed to decode token:', err);
                logout();
            }
        }
    }, [isAuthenticated, access_token, logout]);

    // Fetch full user details if authenticated
    useEffect(() => {
        const fetchProfile = async () => {
            if (isAuthenticated && !user?.firstName) {
                try {
                    const { usersApi } = await import('@/lib/api/users');
                    const fullUser = await usersApi.getMe();
                    if (fullUser && useAuthStore.getState().access_token) {
                        login(fullUser, useAuthStore.getState().access_token!);
                    }
                } catch (err) {
                    console.error('Failed to fetch full profile:', err);
                }
            }
        };
        fetchProfile();
    }, [isAuthenticated, user?.firstName, login]);

    // Sync visit status from the initial device fetch
    useEffect(() => {
        if (businessId && isCustomer) {
            // isFirstTimeVisit comes from useCustomerFlowStore which is populated in initJourney 
            // via fetchDeviceByCode (backend's getDeviceInfo which checks visit history if authenticated)
            setHasVisitedBefore(!isFirstTimeVisit);
        }
    }, [businessId, isCustomer, isFirstTimeVisit]);

    // 1. Session Initialization and Data Fetching
    useEffect(() => {
        const initJourney = async () => {
            if (!deviceCode) return;

            try {
                // If we don't have business info yet, or it's a fresh page load
                if (!businessId || deviceCode !== useCustomerFlowStore.getState().deviceCode) {
                    const device = await fetchDeviceByCode(deviceCode);
                    if (device) {
                        initializeFromBusiness(device);

                        // If it's a returning visitor according to backend, record visit immediately for analytics
                        if (device.isFirstTimeVisit === false) {
                            recordVisit();
                        }
                    } else {
                        throw new Error('Device not found');
                    }
                }

                // Once initialized, move to SCANNING if we are at SELECT_TYPE
                if (useCustomerFlowStore.getState().currentStep === 'SELECT_TYPE' || useCustomerFlowStore.getState().currentStep === 'SCANNING') {
                    setStep('SCANNING');
                }
            } catch (err) {
                console.error('Journey Init Failed:', err);
                router.push('/tap/invalid');
            } finally {
                setIsLoading(false);
            }
        };

        initJourney();
    }, [deviceCode, businessId, initializeFromBusiness, recordVisit, router, setStep]);

    // Live Sync for Staff Approvals
    useEffect(() => {
        if (redemptionStatus === 'pending' && lastRedemptionId) {
            const request = redemptionRequests.find(r => r.id === lastRedemptionId);
            if (request && request.status !== 'pending') {
                if (request.status === 'approved') {
                    setRedemptionStatus('approved');
                    resetVisitCountAfterRedemption(rewardVisitThreshold);
                    toast.success('Your reward has been approved! Claim it now.', { duration: 5000 });
                } else if (request.status === 'declined') {
                    setRedemptionStatus('declined');
                    toast.error('Redemption declined by staff.');
                }
            }
        }
    }, [redemptionRequests, redemptionStatus, lastRedemptionId, setRedemptionStatus, resetVisitCountAfterRedemption, rewardVisitThreshold]);

    const storedIdentity = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('google_identity');
        return saved ? JSON.parse(saved) : null;
    }, []);

    useEffect(() => {
        if (storedIdentity || user || userData) {
            setIsDeviceSynced(!!storedIdentity || !!userData || !!user);
        }
    }, [storedIdentity, user, userData]);

    const handleCredentialResponse = (response: any) => {
        try {
            setIsSyncingReal(true);
            const decoded: any = jwtDecode(response.credential);

            const identity = {
                name: decoded.name,
                email: decoded.email,
                phone: ''
            };
            localStorage.setItem('google_identity', JSON.stringify(identity));
            setIsDeviceSynced(true);
            setUserData(identity);

            setTimeout(() => {
                setIsSyncingReal(false);
                setStep('FORM');
            }, 800);
        } catch (error) {
            console.error("Google Sync Error:", error);
            setStep('FORM');
        }
    };

    // Main Stepper Logic: SCANNING -> IDENTIFYING -> (WELCOME_BACK or FORM)
    useEffect(() => {
        if (currentStep === 'SCANNING') {
            const timer = setTimeout(() => setStep('IDENTIFYING'), 1500);
            return () => clearTimeout(timer);
        }

        if (currentStep === 'IDENTIFYING') {
            // Simulated delay for "Check Profile Cache" effect
            const syncTimeout = setTimeout(() => {
                // Determine if we recognize them (localStorage) OR if the backend says they are returning
                // Actually, if backend says they are returning (!isFirstTimeVisit), we should try to show Welcome Back 
                // even if we don't have local data (maybe they used another device, but for now we follow the "First Time" flag)

                if (storedIdentity || userData || !isFirstTimeVisit || isCustomer) {
                    setStep('WELCOME_BACK');
                } else {
                    setStep('FORM');
                }
            }, 1200);

            return () => clearTimeout(syncTimeout);
        }
    }, [currentStep, setStep, storedIdentity, userData, isFirstTimeVisit, deviceCode, isCustomer]);

    const recordLoyaltyTap = async (identity: any) => {
        try {
            // This monitors the "stay" and triggers rule-based point earnings
            // Authentication is now required as backend was reverted
            const response = await api.post(`/loyalty/tap/${deviceCode}`, {});
            if (response && response.profile) {
                // Refresh local profile state
                const { fetchLoyaltyProfile } = useLoyaltyStore.getState();
                const identifier = identity.email || identity.phone || identity.uniqueId || identity.id;
                fetchLoyaltyProfile(identifier, branchId || 'head-office');

                console.log('Loyalty tap processed:', response);
            }
        } catch (err) {
            console.error('Failed to record loyalty tap:', err);
        }
    };

    const onFormSubmit = async (data: any) => {
        try {
            if (!isCustomer) {
                // Split name into firstName/lastName for backend DTO
                const nameParts = data.name?.trim().split(/\s+/) || ['Visitor'];
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || ' ';
                const defaultPassword = '123456';

                // 1. Register user via public signup endpoint
                await api.post(`/visitors/signup?branchId=${branchId}`, {
                    firstName,
                    lastName,
                    email: data.email,
                    phone: data.phone
                });

                // 2. Performance Silent Login to get a token (Backend uses '123456' for default signup)
                const authResponse = await api.post('/auth/login', {
                    identifier: data.email,
                    password: defaultPassword
                });

                if (authResponse?.access_token) {
                    // Set the session so subsequent 'api' calls include the Bearer token
                    useAuthStore.getState().login(authResponse.user, authResponse.access_token);
                }

                localStorage.setItem('google_identity', JSON.stringify(data));
                setUserData(data);
            }

            const currentBusinessId = useCustomerFlowStore.getState().businessId;
            if (currentBusinessId) {
                // 3. Trigger the rule monitoring stay (loyalty/tap/:code)
                // This is now authenticated via the token we just received
                await recordLoyaltyTap(isCustomer ? user : data);
            }

            if (isCustomer) {
                toast.success('Visit recorded! Opening your dashboard...');
                router.push('/customer/dashboard');
            } else {
                setStep('OUTCOME');
            }
        } catch (err: any) {
            console.error('Registration/Login failed:', err);
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    const handleDownloadReward = () => {
        setIsDownloading(true);
        setTimeout(() => {
            setIsDownloading(false);
            setStep('FINAL_SUCCESS');
            const link = document.createElement('a');
            link.href = '#';
            link.download = `VemTap_Reward_${storeName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 2000);
    };

    const handleRedeem = () => {
        if (!userData && !storedIdentity) {
            toast.error('Identity not found. Please re-identify.');
            return;
        }

        const name = userData?.name || storedIdentity?.name || 'Guest';
        addRedemptionRequest({
            visitorId: userData?.uniqueId || `V-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            visitorName: name,
            rewardTitle: customRewardMessage || "Free Reward",
            branchId: businessId || 'head-office'
        });

        requestRedemption(customRewardMessage || "Free Reward");
        toast.success('Redemption request sent to staff!');
    };

    const handleEngagement = (type: 'review' | 'social' | 'feedback' | 'rewards', formId?: string) => {
        if (type === 'review') {
            window.open(engagementSettings.reviewUrl, '_blank');
        } else if (type === 'feedback') {
            if (formId) {
                const attached = [...approvedFormsForBusiness, ...deviceForms].find((form) => form.id === formId);
                if (attached) {
                    setSelectedBusinessFormId(attached.id);
                    setStep('SURVEY');
                    return;
                }
            }

            setSelectedBusinessFormId(preferredBusinessForm?.id || null);
            setStep('SURVEY');
        } else if (type === 'rewards') {
            toast.success('Reward points added to your account!');
        }
    };

    const handleSurveyComplete = async (answers: Record<string, any>) => {
        if (selectedBusinessForm && businessId) {
            try {
                await submitBusinessFormResponse.mutateAsync({
                    answers: Object.entries(answers).map(([fieldId, value]) => ({
                        fieldId,
                        value,
                    })),
                });
            } catch (error) {
                console.warn('Form response submission failed:', error);
            }
        }

        console.log('Survey completed:', answers);
        toast.success('Thank you for your feedback!');

        if (selectedBusinessForm?.redirectUrl && typeof window !== 'undefined') {
            window.location.assign(selectedBusinessForm.redirectUrl);
            return;
        }

        setSelectedBusinessFormId(null);
        setStep('FINAL_SUCCESS');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Initializing Tap</p>
                </div>
            </div>
        );
    }

    return (
        <VisitorLayout
            onReset={resetFlow}
            onCredentialResponse={handleCredentialResponse}
        >
            <AnimatePresence mode="wait">
                {currentStep === 'SCANNING' && (
                    <StepScanning storeName={storeName} />
                )}

                {currentStep === 'IDENTIFYING' && (
                    <StepIdentifying />
                )}

                {currentStep === 'FORM' && (
                    <StepForm
                        storeName={storeName}
                        logoUrl={logoUrl}
                        customWelcomeMessage={customNewUserWelcomeMessage}
                        customWelcomeTitle={customNewUserWelcomeTitle}
                        customWelcomeTag={customNewUserWelcomeTag}
                        customPrivacyMessage={customPrivacyMessage}
                        initialData={userData || storedIdentity || user}
                        isSyncingReal={isSyncingReal}
                        isDeviceSynced={isDeviceSynced}
                        onBack={() => setStep('SELECT_TYPE')}
                        onSubmit={onFormSubmit}
                    />
                )}

                {currentStep === 'WELCOME_BACK' && (
                    <StepWelcomeBack
                        storeName={storeName}
                        logoUrl={logoUrl}
                        customWelcomeMessage={customWelcomeMessage}
                        customWelcomeTitle={customWelcomeTitle}
                        customWelcomeButton={customWelcomeButton}
                        customWelcomeTag={customWelcomeTag}
                        customPrivacyMessage={customPrivacyMessage}
                        userData={user || userData || storedIdentity || { name: 'Visitor' }}
                        visitCount={visitCount}
                        rewardVisitThreshold={rewardVisitThreshold}
                        hasRewardSetup={hasRewardSetup}
                        redemptionStatus={redemptionStatus}
                        showConsent={isCustomer && !hasVisitedBefore}
                        isCustomer={isCustomer}
                        onRedeem={handleRedeem}
                        onContinue={() => {
                            if (isCustomer) {
                                onFormSubmit({});
                            } else {
                                const identity = userData || storedIdentity;
                                if (identity) {
                                    // If we recognize them, run them through the signup/login flow 
                                    // to ensure they earn points and are authenticated.
                                    onFormSubmit(identity);
                                } else {
                                    // Fallback if no identity found (shouldn't happen in StepWelcomeBack)
                                    setStep('FORM');
                                }
                            }
                        }}
                        onClear={() => {
                            localStorage.removeItem('google_identity');
                            resetFlow();
                            setStep('FORM');
                        }}
                    />
                )}

                {currentStep === 'OUTCOME' && (
                    <StepOutcome
                        config={config}
                        customSuccessMessage={customSuccessMessage}
                        customRewardMessage={customRewardMessage}
                        hasRewardSetup={hasRewardSetup}
                        isDownloading={isDownloading}
                        isFormsLoading={formsLoading}
                        onDownload={handleDownloadReward}
                        onFinish={() => setStep('FINAL_SUCCESS')}
                        onRestart={resetFlow}
                        onEngagement={handleEngagement}
                        engagementSettings={engagementSettings}
                        selectedFormTitle={preferredBusinessForm?.title || null}
                        selectedFormType="Form"
                        attachedForms={attachedBusinessForms.map((form) => ({
                            id: form.id,
                            title: form.title,
                            description: form.description,
                        }))}
                        socialLinks={{
                            instagram: engagementSettings.socialUrl,
                        }}
                    />
                )}

                {currentStep === 'SURVEY' && (
                    selectedBusinessForm ? (
                        <StepBusinessForm
                            form={selectedBusinessForm}
                            onComplete={handleSurveyComplete}
                            onSkip={() => {
                                setSelectedBusinessFormId(null);
                                setStep('FINAL_SUCCESS');
                            }}
                        />
                    ) : (
                        <StepSurvey
                            questions={surveyQuestions}
                            onComplete={handleSurveyComplete}
                            onSkip={() => setStep('FINAL_SUCCESS')}
                        />
                    )
                )}

                {currentStep === 'FINAL_SUCCESS' && (
                    <StepFinalSuccess
                        customSuccessTag={useCustomerFlowStore.getState().customSuccessTag}
                        customSuccessTitle={useCustomerFlowStore.getState().customSuccessTitle}
                        finalSuccessMessage={useCustomerFlowStore.getState().customSuccessMessage || config.finalSuccessMessage}
                        customSuccessButton={useCustomerFlowStore.getState().customSuccessButton}
                        isFormsLoading={formsLoading}
                        onFinish={() => {
                            resetFlow();
                            router.push(`/${businessSlug}?code=${deviceCode}`);
                        }}
                        onEngagement={handleEngagement}
                        engagementSettings={engagementSettings}
                        attachedForms={attachedBusinessForms.map((form) => ({
                            id: form.id,
                            title: form.title,
                            description: form.description,
                        }))}
                        socialLinks={{
                            instagram: engagementSettings.socialUrl,
                        }}
                    />
                )}
            </AnimatePresence>

            <EarnPointsModal
                isOpen={!!lastEarnedResponse}
                onClose={() => setLastEarnedResponse(null)}
                pointsEarned={lastEarnedResponse?.pointsEarned || 0}
                newBalance={lastEarnedResponse?.newBalance || 0}
                message={lastEarnedResponse?.message || ''}
                breakdown={lastEarnedResponse?.breakdown}
            />
        </VisitorLayout>
    );
}
