'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useActiveSubscription } from '@/services/subscriptions/hooks';
import { isOnboardingComplete, nextOnboardingStep } from '@/lib/onboardingGate';

export default function OnboardingRouteGuard({ children }: { children: ReactNode }) {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { data: myBusiness, isLoading: businessLoading } = useMyBusiness();
    const { data: subscription, isLoading: subscriptionLoading } = useActiveSubscription();

    const role = (user?.role as string)?.toLowerCase() || '';
    const isOwner = role === 'owner';

    const hasPlan = !!user?.planId || !!subscription?.plan?.id || !!subscription?.planId;

    useEffect(() => {
        if (!user || !isOwner) return;
        if (businessLoading || subscriptionLoading) return;

        if (!isOnboardingComplete(myBusiness ?? null, hasPlan)) {
            const step = nextOnboardingStep(myBusiness ?? null, hasPlan);
            const query = step != null ? `?step=${step}` : '';
            router.replace(`/onboarding${query}`);
        }
    }, [user, isOwner, myBusiness, subscription, businessLoading, subscriptionLoading, hasPlan, router]);

    if (!user || !isOwner) return <>{children}</>;

    if (businessLoading || subscriptionLoading) {
        return (
            <div className="flex items-center justify-center p-8 h-screen">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!isOnboardingComplete(myBusiness ?? null, hasPlan)) return null;

    return <>{children}</>;
}
