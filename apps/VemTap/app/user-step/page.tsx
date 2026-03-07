'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';
import { useBusinessForms, useSubmitBusinessFormResponse } from '@/services/business-forms/hooks';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';

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

function UserStepPageContent() {
    const {
        currentStep, setStep, storeName, setUserData, resetFlow,
        getBusinessConfig, customWelcomeMessage, customSuccessMessage,
        customPrivacyMessage, customRewardMessage, hasRewardSetup,
        setBusinessType, userData, branchId, logoUrl, visitCount, rewardVisitThreshold,
        redemptionStatus, lastRedemptionId, requestRedemption, setRedemptionStatus, resetVisitCountAfterRedemption,
        engagementSettings, surveyQuestions,
        customNewUserWelcomeMessage, customNewUserWelcomeTitle, customNewUserWelcomeTag, businessId
    } = useCustomerFlowStore();
    const searchParams = useSearchParams();
    const preferredFormIdParam = searchParams.get('formId') || searchParams.get('form');
    const [selectedBusinessFormId, setSelectedBusinessFormId] = useState<string | null>(null);
    const { data: businessForms = [] } = useBusinessForms();
    const submitBusinessFormResponse = useSubmitBusinessFormResponse(selectedBusinessFormId || '');
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    const getDefaultFormId = useFormPreferencesStore((state) => state.getDefaultFormId);
    const formBranchScope = branchId || activeBranchId || userBranchId || null;
    const defaultFormId = getDefaultFormId(formBranchScope || 'global');
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
        () => approvedFormsForBusiness.find((f) => f.id === selectedBusinessFormId) || null,
        [approvedFormsForBusiness, selectedBusinessFormId]
    );
    const preferredBusinessForm = useMemo(() => {
        const explicit = preferredFormIdParam
            ? approvedFormsForBusiness.find((form) => form.id === preferredFormIdParam)
            : undefined;
        const branchDefault = defaultFormId
            ? approvedFormsForBusiness.find((form) => form.id === defaultFormId)
            : undefined;
        return explicit || branchDefault || approvedFormsForBusiness[0] || null;
    }, [approvedFormsForBusiness, preferredFormIdParam, defaultFormId]);

    const addRedemptionRequest = useMockDashboardStore(state => state.addRedemptionRequest);
    const redemptionRequests = useMockDashboardStore(state => state.redemptionRequests);

    const { user } = useAuthStore();
    const { lastEarnedResponse, setLastEarnedResponse } = useLoyaltyStore();
    const config = getBusinessConfig();

    // Live Sync Simulation: Listen for approvals/declines from the business dashboard
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

    const [isDownloading, setIsDownloading] = useState(false);
    const [isSyncingReal, setIsSyncingReal] = useState(false);
    const [isDeviceSynced, setIsDeviceSynced] = useState(false);

    // Form Initialization (Device-First)
    const storedIdentity = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('google_identity');
        return saved ? JSON.parse(saved) : null;
    }, []);

    useEffect(() => {
        if (storedIdentity || user || userData) {
            setIsDeviceSynced(!!storedIdentity || !!userData);
        }
    }, [storedIdentity, user, userData]);

    // Google Identity SDK Integration
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

    // Device-First Transition Logic
    useEffect(() => {
        if (currentStep === 'SCANNING') {
            const timer = setTimeout(() => setStep('IDENTIFYING'), 800);
            return () => clearTimeout(timer);
        }

        if (currentStep === 'IDENTIFYING') {
            if ((window as any).google && (window as any).google.accounts.id) {
                (window as any).google.accounts.id.prompt();
            }

            const syncTimeout = setTimeout(() => {
                if (storedIdentity || userData) {
                    setStep('WELCOME_BACK');
                } else {
                    setStep('FORM');
                }
            }, (storedIdentity || userData) ? 500 : 2000);

            return () => clearTimeout(syncTimeout);
        }
    }, [currentStep, setStep, storedIdentity, userData]);

    const onFormSubmit = async (data: any) => {
        localStorage.setItem('google_identity', JSON.stringify(data));
        setUserData(data);

        // Loyalty Integration: Earn points for the visit after identity is provided
        const businessId = useCustomerFlowStore.getState().businessId;
        if (businessId) {
            const { earnPoints } = useLoyaltyStore.getState();
            earnPoints({
                userId: data.email || data.phone || data.uniqueId || 'anonymous',
                businessId: businessId,
                branchId: branchId || 'head-office',
                isVisit: true
            }).catch(err => console.error('Failed to earn points after form submit:', err));
        }

        setStep('OUTCOME');
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
        // 1. Request in business dashboard
        addRedemptionRequest({
            visitorId: userData?.uniqueId || `V-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            visitorName: name,
            rewardTitle: customRewardMessage || "Free Reward",
            branchId: useCustomerFlowStore.getState().businessId || 'head-office'
        });

        // 2. Update customer state
        requestRedemption(customRewardMessage || "Free Reward");
        toast.success('Redemption request sent to staff!');
    };

    const handleEngagement = (type: 'review' | 'social' | 'feedback' | 'rewards') => {
        if (type === 'review') {
            window.open(engagementSettings.reviewUrl, '_blank');
        } else if (type === 'social') {
            // Handled by the component's internal modal
        } else if (type === 'feedback') {
            const explicitlyRequested = preferredFormIdParam
                ? approvedFormsForBusiness.find((form) => form.id === preferredFormIdParam)
                : null;

            if (explicitlyRequested) {
                setSelectedBusinessFormId(explicitlyRequested.id);
            } else {
                setSelectedBusinessFormId(preferredBusinessForm?.id || null);
            }
            setStep('SURVEY');
        } else if (type === 'rewards') {
            // Logic for rewards - maybe a toast or a new step?
            toast.success('Reward points added to your account!');
        }
    };

    const handleSurveyComplete = async (answers: Record<string, any>) => {
        if (selectedBusinessForm && businessId) {
            const identity = userData || storedIdentity || user;
            try {
                await submitBusinessFormResponse.mutateAsync({
                    customerName: identity?.name || 'Guest',
                    customerEmail: identity?.email || undefined,
                    customerPhone: identity?.phone || undefined,
                    answers,
                });
            } catch (error) {
                // Keep journey smooth even if response endpoint is unavailable.
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

    return (
        <VisitorLayout
            onReset={resetFlow}
            onCredentialResponse={handleCredentialResponse}
        >
            <AnimatePresence mode="wait">
                {currentStep === 'SELECT_TYPE' && (
                    <StepSelectType
                        onSelect={(type) => {
                            setBusinessType(type);
                            setStep('SCANNING');
                        }}
                    />
                )}

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
                        userData={userData || storedIdentity}
                        visitCount={visitCount}
                        rewardVisitThreshold={rewardVisitThreshold}
                        hasRewardSetup={hasRewardSetup}
                        redemptionStatus={redemptionStatus}
                        onRedeem={handleRedeem}
                        onContinue={() => {
                            // Loyalty Integration: Earn points if not already triggered by a logged-in session
                            if (!user && (userData || storedIdentity)) {
                                const businessId = useCustomerFlowStore.getState().businessId;
                                if (businessId) {
                                    const { earnPoints } = useLoyaltyStore.getState();
                                    const identity = userData || storedIdentity;
                                    earnPoints({
                                        userId: identity.email || identity.phone || identity.uniqueId || 'recognized-visitor',
                                        businessId: businessId,
                                        branchId: branchId || 'head-office',
                                        isVisit: true
                                    }).catch(err => console.error('Failed to earn points on welcome back:', err));
                                }
                            }
                            setStep('OUTCOME');
                        }}
                        onClear={() => {
                            localStorage.removeItem('google_identity');
                            resetFlow();
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
                        onDownload={handleDownloadReward}
                        onFinish={() => setStep('FINAL_SUCCESS')}
                        onRestart={resetFlow}
                        onEngagement={handleEngagement}
                        engagementSettings={engagementSettings}
                        selectedFormTitle={preferredBusinessForm?.title || null}
                        selectedFormType="Form"
                        socialLinks={{
                            instagram: engagementSettings.socialUrl,
                            // Add other placeholder or config links here
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
                        onFinish={resetFlow}
                        onEngagement={handleEngagement}
                        engagementSettings={engagementSettings}
                        socialLinks={{
                            instagram: engagementSettings.socialUrl,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Loyalty Integration: Earn Points Modal */}
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

export default function UserStepPage() {
    return (
        <Suspense fallback={null}>
            <UserStepPageContent />
        </Suspense>
    );
}
